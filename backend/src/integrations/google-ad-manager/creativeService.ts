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
  creativeType?: 'IMAGE' | 'HTML5' | 'THIRD_PARTY' | 'INTERNAL_REDIRECT' | 'CUSTOM' | 'NATIVE';
  thirdPartySnippet?: string;
  isSafeFrameCompatible?: boolean;
  cm360Url?: string;
  customCode?: string;
  nativeFields?: any;
  networkCode?: string;
  campaignId?: string;
  isDryRun?: boolean;
}

export class GoogleAdManagerCreativeService {
  /**
   * Creates a new Creative (ImageCreative, ThirdPartyCreative, InternalRedirectCreative, etc.) in Google Ad Manager
   */
  public static async createCreative(
    params: CreateCreativeParams
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanTargetUrl = (params.targetUrl || '').replace(/&/g, '&amp;');
    const cleanAdvertiserId = String(params.advertiserId || '').replace(/^ADV-/, '').trim();
    const type = params.creativeType || 'IMAGE';

    let creativeNodeXml = '';

    if (type === 'THIRD_PARTY') {
      const cleanSnippet = (params.thirdPartySnippet || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      creativeNodeXml = `
        <ns:creatives xsi:type="ns:ThirdPartyCreative">
          <ns:advertiserId>${cleanAdvertiserId}</ns:advertiserId>
          <ns:name>${params.name}</ns:name>
          <ns:size>
            <ns:width>${params.size.width}</ns:width>
            <ns:height>${params.size.height}</ns:height>
            <ns:isAspectRatio>false</ns:isAspectRatio>
          </ns:size>
          <ns:snippet>${cleanSnippet}</ns:snippet>
          <ns:isSafeFrameCompatible>${params.isSafeFrameCompatible !== false}</ns:isSafeFrameCompatible>
        </ns:creatives>
      `;
    } else if (type === 'INTERNAL_REDIRECT') {
      const redirectUrl = (params.cm360Url || params.targetUrl || '').replace(/&/g, '&amp;');
      creativeNodeXml = `
        <ns:creatives xsi:type="ns:InternalRedirectCreative">
          <ns:advertiserId>${cleanAdvertiserId}</ns:advertiserId>
          <ns:name>${params.name}</ns:name>
          <ns:size>
            <ns:width>${params.size.width}</ns:width>
            <ns:height>${params.size.height}</ns:height>
            <ns:isAspectRatio>false</ns:isAspectRatio>
          </ns:size>
          <ns:internalRedirectUrl>${redirectUrl}</ns:internalRedirectUrl>
        </ns:creatives>
      `;
    } else if (type === 'CUSTOM') {
      const cleanCode = (params.customCode || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      creativeNodeXml = `
        <ns:creatives xsi:type="ns:CustomCreative">
          <ns:advertiserId>${cleanAdvertiserId}</ns:advertiserId>
          <ns:name>${params.name}</ns:name>
          <ns:size>
            <ns:width>${params.size.width}</ns:width>
            <ns:height>${params.size.height}</ns:height>
            <ns:isAspectRatio>false</ns:isAspectRatio>
          </ns:size>
          <ns:destinationUrl>${cleanTargetUrl}</ns:destinationUrl>
          <ns:htmlSnippet>${cleanCode}</ns:htmlSnippet>
        </ns:creatives>
      `;
    } else {
      // Default: ImageCreative
      let assetXml = '';
      if (params.bannerUrl && params.bannerUrl.startsWith('data:image/')) {
        const base64Data = params.bannerUrl.split(',')[1];
        assetXml = `<ns:assetByteArray>${base64Data}</ns:assetByteArray>`;
      } else if (params.bannerUrl) {
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

      creativeNodeXml = `
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
      `;
    }

    const bodyXml = `
      <ns:createCreatives>
        ${creativeNodeXml}
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
