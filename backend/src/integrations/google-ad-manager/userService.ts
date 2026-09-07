import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';

export interface GamUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

/**
 * GAM UserService wrapper — fetches the current authenticated user.
 * Used to get the traffickerId required when creating Orders.
 */
export class GoogleAdManagerUserService {
  // Cache per networkCode so we don't hit GAM on every order
  private static cache: Record<string, { user: GamUser; expiresAt: number }> = {};

  public static async getCurrentUser(
    networkCode?: string,
    isDryRun: boolean = false
  ): Promise<GamUser | null> {
    const cacheKey = networkCode || 'default';
    const cached = this.cache[cacheKey];
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    if (isDryRun) {
      return { id: '999999999', name: 'Dry Run User', email: 'dryrun@example.com', roleId: '1' };
    }

    const token = await GoogleAdManagerAuthService.getAccessToken();
    const bodyXml = `<ns:getCurrentUser xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;

    const response = await soapClient.execute({
      service: 'UserService',
      action: 'getCurrentUser',
      bodyXml,
      networkCode
    }, token || undefined);

    if (!response.success || !response.data) {
      console.error('[UserService] getCurrentUser failed:', response.error);
      return null;
    }

    const rval = response.data.rval || response.data;
    const user: GamUser = {
      id: String(rval.id || ''),
      name: String(rval.name || ''),
      email: String(rval.email || ''),
      roleId: String(rval.roleId || '')
    };

    if (!user.id) return null;

    // Cache for 30 minutes
    this.cache[cacheKey] = { user, expiresAt: Date.now() + 30 * 60 * 1000 };
    console.log(`[UserService] Current GAM user: ${user.name} (ID: ${user.id})`);
    return user;
  }
}
