import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';
import { AdSize } from '../../types';

export class GoogleAdManagerInventoryService {
  // Cache root ad unit IDs per network to avoid repeated lookups
  private static rootAdUnitCache: Record<string, string> = {};

  /**
   * Fetches the root (top-level) Ad Unit ID for a network.
   * GAM requires all child Ad Units to have a parentId pointing to the root.
   */
  public static async getRootAdUnitId(
    networkCode?: string,
    isDryRun: boolean = false
  ): Promise<string | null> {
    const cacheKey = networkCode || 'default';
    if (this.rootAdUnitCache[cacheKey]) {
      return this.rootAdUnitCache[cacheKey];
    }

    if (isDryRun) return null;

    // 1. Primary Method: NetworkService.getCurrentNetwork returns effectiveRootAdUnitId directly
    try {
      const { GoogleAdManagerNetworkService } = await import('./networkService');
      const network = await GoogleAdManagerNetworkService.getCurrentNetwork(networkCode, isDryRun);
      if (network && network.effectiveRootAdUnitId) {
        const rootId = String(network.effectiveRootAdUnitId);
        this.rootAdUnitCache[cacheKey] = rootId;
        console.log(`[InventoryService] Found effectiveRootAdUnitId for network ${networkCode}: ${rootId}`);
        return rootId;
      }
    } catch (e) {
      console.warn(`[InventoryService] Failed to fetch root ad unit via NetworkService:`, e);
    }

    // 2. Fallback: Query InventoryService for top-level ad unit
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const bodyXml = `
      <ns:getAdUnitsByStatement>
        <ns:filterStatement>
          <ns:query>WHERE parentId IS NULL LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getAdUnitsByStatement>
    `;

    const response = await soapClient.execute({
      service: 'InventoryService',
      action: 'getAdUnitsByStatement',
      bodyXml,
      networkCode
    }, token || undefined);

    if (!response.success) return null;

    const rval = response.data?.rval;
    if (rval && rval.results) {
      const results = Array.isArray(rval.results) ? rval.results : [rval.results];
      if (results.length > 0 && results[0].id) {
        const rootId = String(results[0].id);
        this.rootAdUnitCache[cacheKey] = rootId;
        console.log(`[InventoryService] Root ad unit for network ${networkCode} (via statement): ${rootId}`);
        return rootId;
      }
    }
    return null;
  }

  /**
   * Searches for an Ad Unit by its code in GAM for the given network.
   */
  public static async findAdUnitByCode(
    adUnitCode: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string; name: string; adUnitCode: string } | null> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanCode = adUnitCode.replace(/'/g, "\\'");

    const bodyXml = `
      <ns:getAdUnitsByStatement>
        <ns:filterStatement>
          <ns:query>WHERE adUnitCode = '${cleanCode}' LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getAdUnitsByStatement>
    `;

    const response = await soapClient.execute({
      service: 'InventoryService',
      action: 'getAdUnitsByStatement',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      return null;
    }

    const rval = response.data?.rval;
    if (rval && rval.results) {
      const results = Array.isArray(rval.results) ? rval.results : [rval.results];
      if (results.length > 0 && results[0].id) {
        return {
          id: String(results[0].id),
          name: String(results[0].name || adUnitCode),
          adUnitCode: String(results[0].adUnitCode || adUnitCode)
        };
      }
    }

    return null;
  }

  /**
   * Creates a new Ad Unit in GAM.
   * Field order per GAM XSD: parentId → name → adUnitCode → targetWindow → adUnitSizes
   */
  public static async createAdUnit(
    name: string,
    adUnitCode: string,
    sizes: AdSize[],
    parentGoogleAdUnitId?: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();

    const adUnitSizesXml = sizes.map(s => `
      <ns:adUnitSizes>
        <ns:size>
          <ns:width>${s.width}</ns:width>
          <ns:height>${s.height}</ns:height>
          <ns:isAspectRatio>false</ns:isAspectRatio>
        </ns:size>
        <ns:environmentType>BROWSER</ns:environmentType>
      </ns:adUnitSizes>
    `).join('');

    const parentXml = parentGoogleAdUnitId ? `<ns:parentId>${parentGoogleAdUnitId}</ns:parentId>` : '';

    const bodyXml = `
      <ns:createAdUnits>
        <ns:adUnits>
          ${parentXml}
          <ns:name>${name}</ns:name>
          <ns:adUnitCode>${adUnitCode}</ns:adUnitCode>
          ${adUnitSizesXml}
        </ns:adUnits>
      </ns:createAdUnits>
    `;

    const response = await soapClient.execute({
      service: 'InventoryService',
      action: 'createAdUnits',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create Ad Unit in Google Ad Manager.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Ensure Ad Unit code is unique and valid.'
      };
    }

    const rval = response.data?.rval;
    const created = Array.isArray(rval) ? rval[0] : rval;
    const id = created?.id ? String(created.id) : undefined;

    return {
      success: true,
      id
    };
  }
}
