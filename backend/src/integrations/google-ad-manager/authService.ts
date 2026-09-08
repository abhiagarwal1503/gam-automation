import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { settingsRepo } from '../../repositories';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export class GoogleAdManagerAuthService {
  /**
   * Loads the service account key if present
   */
  public static getServiceAccount(): any | null {
    // 1. Check direct config / settings
    const settings = settingsRepo.get() || {};
    if (settings.serviceAccountKey) {
      try {
        return typeof settings.serviceAccountKey === 'string'
          ? JSON.parse(settings.serviceAccountKey)
          : settings.serviceAccountKey;
      } catch {}
    }

    // 2. Check local file in config/service-account.json across possible runtime paths
    const candidatePaths = [
      path.resolve(__dirname, '../../config/service-account.json'),
      path.resolve(__dirname, '../../../src/config/service-account.json'),
      path.resolve(process.cwd(), 'src/config/service-account.json'),
      path.resolve(process.cwd(), 'dist/config/service-account.json'),
      path.resolve(process.cwd(), 'config/service-account.json')
    ];

    if (config.gam.serviceAccountKeyPath) {
      candidatePaths.unshift(path.resolve(config.gam.serviceAccountKeyPath));
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          return JSON.parse(content);
        } catch (err) {
          console.warn('Could not read service account file at', p, err);
        }
      }
    }

    // 3. Check environment variables GAM_SERVICE_ACCOUNT_JSON or GAM_SERVICE_ACCOUNT_KEY
    const envJson = process.env.GAM_SERVICE_ACCOUNT_JSON || process.env.GAM_SERVICE_ACCOUNT_KEY;
    if (envJson) {
      try {
        return JSON.parse(envJson);
      } catch {}
    }

    return null;
  }

  /**
   * Generates an access token using Service Account JWT Bearer assertion
   */
  public static async getAccessTokenFromServiceAccount(serviceAccount: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/dfp',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');

    // Clean and normalize private_key (ensuring actual newlines)
    let privateKey: string = serviceAccount.private_key;
    if (typeof privateKey === 'string') {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${encodedHeader}.${encodedClaim}`);
    const signature = signer.sign(privateKey, 'base64url');
    const jwt = `${encodedHeader}.${encodedClaim}.${signature}`;

    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const response = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000
    };

    return data.access_token;
  }

  /**
   * Generates the Google OAuth 2.0 Authorization URL for user consent
   */
  public static getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: config.gam.clientId || '',
      redirect_uri: config.gam.redirectUri,
      response_type: 'code',
      scope: config.gam.oauthScope,
      access_type: 'offline',
      prompt: 'consent'
    });
    return `${config.gam.oauthAuthUrl}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for access & refresh tokens
   */
  public static async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const response = await axios.post(config.gam.oauthTokenUrl, {
      code,
      client_id: config.gam.clientId,
      client_secret: config.gam.clientSecret,
      redirect_uri: config.gam.redirectUri,
      grant_type: 'authorization_code'
    });

    const data = response.data;
    if (data.refresh_token) {
      const currentSettings = settingsRepo.get() || {};
      currentSettings.googleRefreshToken = data.refresh_token;
      settingsRepo.save(currentSettings);
    }

    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Retrieves a valid OAuth2 Bearer Access Token (using Service Account or refresh token)
   */
  public static async getAccessToken(): Promise<string | null> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.accessToken;
    }

    // 1. Try Service Account first
    const serviceAccount = this.getServiceAccount();
    if (serviceAccount && serviceAccount.client_email && serviceAccount.private_key) {
      try {
        return await this.getAccessTokenFromServiceAccount(serviceAccount);
      } catch (err: any) {
        console.error('Service Account Token exchange failed:', err.response?.data || err.message);
      }
    }

    // 2. Try OAuth Refresh Token
    const settings = settingsRepo.get() || {};
    const refreshToken = settings.googleRefreshToken || config.gam.refreshToken;
    const clientId = settings.googleClientId || config.gam.clientId;
    const clientSecret = settings.googleClientSecret || config.gam.clientSecret;

    if (!refreshToken || !clientId || !clientSecret) {
      return null;
    }

    try {
      const response = await axios.post(config.gam.oauthTokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      const data = response.data;
      cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000
      };

      return data.access_token;
    } catch (err: any) {
      console.warn('OAuth Token refresh failed:', err.message);
      return null;
    }
  }

  /**
   * Check if authentication is currently active / configured
   */
  public static isConnected(): boolean {
    const serviceAccount = this.getServiceAccount();
    if (serviceAccount && serviceAccount.client_email && serviceAccount.private_key) {
      return true;
    }

    const settings = settingsRepo.get() || {};
    return Boolean(
      (settings.googleRefreshToken || config.gam.refreshToken) &&
      (settings.googleClientId || config.gam.clientId)
    );
  }
}
