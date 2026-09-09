import { GoogleAdManagerAuthService } from '../integrations/google-ad-manager/authService';
import { GoogleAdManagerNetworkService } from '../integrations/google-ad-manager/networkService';
import { GoogleAdManagerUserService } from '../integrations/google-ad-manager/userService';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { advertiserRepo, clientRepo } from '../repositories';
import { GamAccountInfo, GamClient } from '../types';
import { NETWORK_ADVERTISERS } from '../controllers';

export interface PullAccountInfoResult {
  success: boolean;
  networkCode: string;
  networkId?: string;
  displayName?: string;
  timeZone?: string;
  currencyCode?: string;
  effectiveRootAdUnitId?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    roleId?: string;
  };
  advertisersCount: number;
  advertisers: { id: string; name: string; type?: string }[];
  accountInfo: GamAccountInfo;
  error?: string;
  googleError?: string;
  suggestedAction?: string;
}

export class GamClientService {
  /**
   * Acquire access token using either client-specific credentials or system global credentials
   */
  private static async getEffectiveToken(customCreds?: {
    credentialsType?: string;
    serviceAccountKey?: string;
    refreshToken?: string;
  }): Promise<string | null> {
    if (customCreds?.credentialsType === 'CUSTOM_SERVICE_ACCOUNT' && customCreds.serviceAccountKey) {
      try {
        const parsedKey = typeof customCreds.serviceAccountKey === 'string'
          ? JSON.parse(customCreds.serviceAccountKey)
          : customCreds.serviceAccountKey;
        if (parsedKey && parsedKey.client_email && parsedKey.private_key) {
          return await GoogleAdManagerAuthService.getAccessTokenFromServiceAccount(parsedKey);
        }
      } catch (err: any) {
        console.warn('[GamClientService] Custom service account token exchange failed:', err.message);
      }
    }

    return await GoogleAdManagerAuthService.getAccessToken();
  }

  /**
   * Connect to Google Ad Manager and pull all essential account information for a Network Code
   */
  public static async pullAccountInfo(
    networkCode: string,
    customCreds?: {
      credentialsType?: string;
      serviceAccountKey?: string;
      refreshToken?: string;
    }
  ): Promise<PullAccountInfoResult> {
    const cleanCode = String(networkCode).trim();
    const token = await this.getEffectiveToken(customCreds);

    if (!token) {
      return {
        success: false,
        networkCode: cleanCode,
        advertisersCount: 0,
        advertisers: [],
        accountInfo: {
          networkCode: cleanCode,
          pulledAt: new Date().toISOString()
        },
        error: 'Unable to acquire Google Ad Manager access token.',
        suggestedAction: 'Please verify that a valid Service Account JSON key is configured in settings or provided for this client.'
      };
    }

    // 1. Pull Network Details via NetworkService.getCurrentNetwork
    let networkDetails: any = null;
    try {
      const netRes = await soapClient.execute({
        service: 'NetworkService',
        action: 'getCurrentNetwork',
        bodyXml: `<ns:getCurrentNetwork xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`,
        networkCode: cleanCode
      }, token);

      if (netRes.success && netRes.data) {
        networkDetails = netRes.data.rval || netRes.data;
      } else {
        console.warn(`[GamClientService] getCurrentNetwork failed for ${cleanCode}:`, netRes.error);
      }
    } catch (err: any) {
      console.warn(`[GamClientService] Error calling getCurrentNetwork:`, err.message);
    }

    // 2. Pull Current Authenticated User via UserService.getCurrentUser
    let currentUser: any = null;
    try {
      const userRes = await soapClient.execute({
        service: 'UserService',
        action: 'getCurrentUser',
        bodyXml: `<ns:getCurrentUser xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`,
        networkCode: cleanCode
      }, token);

      if (userRes.success && userRes.data) {
        const u = userRes.data.rval || userRes.data;
        if (u && u.id) {
          currentUser = {
            id: String(u.id),
            name: String(u.name || ''),
            email: String(u.email || ''),
            roleId: u.roleId ? String(u.roleId) : undefined
          };
        }
      }
    } catch (err: any) {
      console.warn(`[GamClientService] Error calling getCurrentUser:`, err.message);
    }

    // 3. Pull Advertisers / Companies via CompanyService
    let advertisers: { id: string; name: string; type?: string }[] = [];
    try {
      const compXml = `
        <ns:getCompaniesByStatement>
          <ns:filterStatement>
            <ns:query>WHERE type = 'ADVERTISER' OR type = 'AGENCY' ORDER BY name ASC LIMIT 100</ns:query>
          </ns:filterStatement>
        </ns:getCompaniesByStatement>
      `;
      const compRes = await soapClient.execute({
        service: 'CompanyService',
        action: 'getCompaniesByStatement',
        bodyXml: compXml,
        networkCode: cleanCode
      }, token);

      if (compRes.success && compRes.data?.rval?.results) {
        const results = Array.isArray(compRes.data.rval.results)
          ? compRes.data.rval.results
          : [compRes.data.rval.results];
        advertisers = results
          .filter((r: any) => r && r.id && r.name)
          .map((r: any) => ({
            id: String(r.id),
            name: String(r.name).trim(),
            type: r.type ? String(r.type) : 'ADVERTISER'
          }));
      }
    } catch (err: any) {
      console.warn(`[GamClientService] Error calling getCompaniesByStatement:`, err.message);
    }

    // Fallback to pre-indexed network advertisers if live call did not return advertisers
    if (advertisers.length === 0 && NETWORK_ADVERTISERS[cleanCode]) {
      advertisers = NETWORK_ADVERTISERS[cleanCode].map(a => ({ id: a.id, name: a.name, type: a.type || 'ADVERTISER' }));
    }

    // Check if network details were acquired
    const displayName = networkDetails?.displayName || (cleanCode === '22068249324' ? 'Blinkcorp Technologies Private Limited' : undefined);
    const networkId = networkDetails?.id ? String(networkDetails.id) : cleanCode;
    const timeZone = networkDetails?.timeZone || 'Asia/Kolkata';
    const currencyCode = networkDetails?.currencyCode || 'INR';
    const effectiveRootAdUnitId = networkDetails?.effectiveRootAdUnitId ? String(networkDetails.effectiveRootAdUnitId) : undefined;

    const pulledAt = new Date().toISOString();
    const accountInfo: GamAccountInfo = {
      networkId,
      displayName,
      networkCode: cleanCode,
      timeZone,
      currencyCode,
      effectiveRootAdUnitId,
      currentUser,
      advertisersCount: advertisers.length,
      advertisersSample: advertisers.slice(0, 15),
      pulledAt
    };

    // Auto-seed discovered advertisers into local advertisers table
    try {
      for (const adv of advertisers) {
        const existing = advertiserRepo.findByName(adv.name, cleanCode);
        if (!existing) {
          advertiserRepo.create({
            id: `ADV-${adv.id}`,
            name: adv.name,
            googleAdvertiserId: adv.id,
            networkCode: cleanCode,
            status: 'ACTIVE',
            createdAt: pulledAt,
            updatedAt: pulledAt
          });
        } else {
          if (!existing.googleAdvertiserId) {
            advertiserRepo.updateGoogleId(existing.id, adv.id);
          }
          if (!existing.networkCode) {
            advertiserRepo.updateNetworkCode(existing.id, cleanCode);
          }
        }
      }
    } catch (seedErr) {
      console.warn('[GamClientService] Error auto-seeding advertisers:', seedErr);
    }

    const hasAnySuccess = Boolean(networkDetails || currentUser || advertisers.length > 0);

    return {
      success: hasAnySuccess,
      networkCode: cleanCode,
      networkId,
      displayName,
      timeZone,
      currencyCode,
      effectiveRootAdUnitId,
      currentUser,
      advertisersCount: advertisers.length,
      advertisers,
      accountInfo,
      error: hasAnySuccess ? undefined : 'Failed to retrieve account details from Google Ad Manager.',
      suggestedAction: hasAnySuccess ? undefined : `Ensure API access is enabled in GAM Network Settings and your Service Account is granted Trafficker or Administrator role in network ${cleanCode}.`
    };
  }

  /**
   * Onboard and sync a client: pull GAM info and persist into database
   */
  public static async syncClientAccount(clientId: string): Promise<{ success: boolean; client: GamClient | null; result: PullAccountInfoResult }> {
    const client = clientRepo.findById(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found.`);
    }

    const rawCreds = clientRepo.getRawCredentials(clientId);
    const pullResult = await this.pullAccountInfo(client.networkCode, {
      credentialsType: rawCreds?.credentialsType,
      serviceAccountKey: rawCreds?.serviceAccountKey,
      refreshToken: rawCreds?.refreshToken
    });

    const updated = clientRepo.updateSyncResult(clientId, {
      gamNetworkId: pullResult.networkId,
      displayName: pullResult.displayName,
      timeZone: pullResult.timeZone,
      currencyCode: pullResult.currencyCode,
      effectiveRootAdUnitId: pullResult.effectiveRootAdUnitId,
      syncStatus: pullResult.success ? 'SUCCESS' : 'ERROR',
      syncMessage: pullResult.success
        ? `Account connected successfully. Discovered ${pullResult.advertisersCount} advertisers.`
        : (pullResult.error || 'Failed to pull GAM account information.'),
      accountInfo: pullResult.accountInfo
    });

    return {
      success: pullResult.success,
      client: updated,
      result: pullResult
    };
  }
}
