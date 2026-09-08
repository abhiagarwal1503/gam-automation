import axios from 'axios';
import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';
import { AdSize } from '../../types';

export interface CreateCreativeParams {
  advertiserId: string;
  name: string;
  bannerUrl: string;
  targetUrl: string;
  size: AdSize;
  networkCode?: string;
  campaignId?: string;
  isDryRun?: boolean;
}

export class GoogleAdManagerCreativeService {
  /**
   * Creates a new ImageCreative in Google Ad Manager
   */
  public static async createCreative(
    params: CreateCreativeParams
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanTargetUrl = params.targetUrl.replace(/&/g, '&amp;');
    const cleanAdvertiserId = String(params.advertiserId || '').replace(/^ADV-/, '').trim();

    // Fetch image asset as base64 bytes for reliable GAM asset upload
    let assetXml = '';
    if (params.bannerUrl.startsWith('data:image/')) {
      const base64Data = params.bannerUrl.split(',')[1];
      assetXml = `<ns:assetByteArray>${base64Data}</ns:assetByteArray>`;
    } else {
      const cleanBannerUrl = params.bannerUrl.replace(/&/g, '&amp;');
      assetXml = `<ns:assetUrl>${cleanBannerUrl}</ns:assetUrl>`;
      try {
        const imgRes = await axios.get(params.bannerUrl, { responseType: 'arraybuffer', timeout: 10000 });
        if (imgRes.status === 200 && imgRes.data) {
          const base64Data = Buffer.from(imgRes.data).toString('base64');
          assetXml = `<ns:assetByteArray>${base64Data}</ns:assetByteArray>`;
        }
      } catch {
        // Fallback to assetUrl if fetch fails
      }
    }

    const bodyXml = `
      <ns:createCreatives>
        <ns:creatives xsi:type="ns:ImageCreative">
          <ns:advertiserId>${cleanAdvertiserId}</ns:advertiserId>
          <ns:name>${params.name}</ns:name>
          <ns:size>
            <ns:width>${params.size.width}</ns:width>
            <ns:height>${params.size.height}</ns:height>
            <ns:isAspectRatio>false</ns:isAspectRatio>
          </ns:size>
          <ns:destinationUrl>${cleanTargetUrl}</ns:destinationUrl>
          <ns:primaryImageAsset>
            ${assetXml}
            <ns:fileName>${params.name}.jpg</ns:fileName>
            <ns:size>
              <ns:width>${params.size.width}</ns:width>
              <ns:height>${params.size.height}</ns:height>
              <ns:isAspectRatio>false</ns:isAspectRatio>
            </ns:size>
          </ns:primaryImageAsset>
        </ns:creatives>
      </ns:createCreatives>
    `;

    const response = await soapClient.execute({
      service: 'CreativeService',
      action: 'createCreatives',
      bodyXml,
      networkCode: params.networkCode,
      campaignId: params.campaignId,
      isDryRun: params.isDryRun
    }, token || undefined);

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create Creative in Google Ad Manager.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Ensure banner URL is accessible and matches creative size.'
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

  /**
   * Searches for a Creative by name and advertiserId in GAM
   */
  public static async findCreativeByName(
    name: string,
    advertiserId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string; name: string } | null> {
    if (isDryRun) return null;
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanName = name.replace(/'/g, "\\'");
    const cleanAdvertiserId = String(advertiserId || '').replace(/^ADV-/, '').trim();

    const bodyXml = `
      <ns:getCreativesByStatement>
        <ns:filterStatement>
          <ns:query>WHERE advertiserId = ${cleanAdvertiserId} AND name = '${cleanName}' LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getCreativesByStatement>
    `;

    const response = await soapClient.execute({
      service: 'CreativeService',
      action: 'getCreativesByStatement',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) return null;

    const rval = response.data?.rval;
    if (rval && rval.results) {
      const results = Array.isArray(rval.results) ? rval.results : [rval.results];
      if (results.length > 0 && results[0].id) {
        return {
          id: String(results[0].id),
          name: String(results[0].name || name)
        };
      }
    }
    return null;
  }
}
