import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';

export interface GamNetwork {
  id: string;
  displayName: string;
  networkCode: string;
  timeZone: string;
  currencyCode: string;
  effectiveRootAdUnitId?: string;
}

export class GoogleAdManagerNetworkService {
  /**
   * Retrieves the current network details from Google Ad Manager NetworkService
   */
  public static async getCurrentNetwork(networkCode?: string, isDryRun: boolean = false): Promise<GamNetwork | null> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const bodyXml = `<ns:getCurrentNetwork xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;

    const response = await soapClient.execute({
      service: 'NetworkService',
      action: 'getCurrentNetwork',
      bodyXml,
      networkCode,
      isDryRun
    }, token || undefined);

    if (!response.success || !response.data) {
      return null;
    }

    const rval = response.data.rval || response.data;
    return {
      id: String(rval.id || '12345678'),
      displayName: rval.displayName || 'Primary GAM Network',
      networkCode: String(rval.networkCode || networkCode || '12345678'),
      timeZone: rval.timeZone || 'America/New_York',
      currencyCode: rval.currencyCode || 'USD',
      effectiveRootAdUnitId: rval.effectiveRootAdUnitId ? String(rval.effectiveRootAdUnitId) : undefined
    };
  }
}
