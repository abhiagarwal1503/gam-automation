import axios from 'axios';
import {
  cmsPartnerRepo,
  campaignRepo,
  adUnitRepo,
  gptTagRepo,
  logRepo
} from '../repositories';
import { CmsPartner, CmsSyncResult, GptTag, AdUnit, CmsElement, PushDfpResult } from '../types';
import { config } from '../config';
import { generateGPTTags } from '../utils/gptGenerator';

export class CmsSyncService {
  /**
   * Builds normalized full URL for a CMS partner endpoint
   */
  public static buildPartnerUrl(endpoint: string, apiPath: string): string {
    let cleanEndpoint = (endpoint || '').trim().replace(/\/+$/, '');
    if (!cleanEndpoint.startsWith('http://') && !cleanEndpoint.startsWith('https://')) {
      cleanEndpoint = `https://${cleanEndpoint}`;
    }
    const cleanPath = (apiPath || '').trim().startsWith('/') ? apiPath.trim() : `/${apiPath.trim()}`;
    return `${cleanEndpoint}${cleanPath}`;
  }

  /**
   * Automatically or manually pushes campaign GPT tags & ad units to active CMS partners
   */
  public static async syncCampaign(campaignId: string, specificPartnerId?: string): Promise<CmsSyncResult[]> {
    const campaign = campaignRepo.findById(campaignId);
    if (!campaign) {
      return [{
        success: false,
        partnerId: specificPartnerId || 'unknown',
        partnerName: 'Unknown',
        endpoint: '',
        error: `Campaign ${campaignId} not found.`
      }];
    }

    const gptTags = gptTagRepo.findByCampaignId(campaignId);
    const allAdUnits = adUnitRepo.list();
    const networkCode = (campaign as any).networkCode || config.gam.networkCode || '12345678';

    // Determine target partners
    let partners: CmsPartner[] = [];
    if (specificPartnerId) {
      const p = cmsPartnerRepo.findById(specificPartnerId);
      if (p) partners = [p];
    } else {
      partners = cmsPartnerRepo.findActive().filter(p => p.autoSyncCampaigns);
    }

    if (partners.length === 0) {
      return [{
        success: true,
        partnerId: 'none',
        partnerName: 'None',
        endpoint: '',
        message: 'No active CMS partners configured for automatic campaign sync.'
      }];
    }

    const results: CmsSyncResult[] = [];

    // Prepare unified tag and ad unit items
    const formattedAdUnits = gptTags.map((tag: GptTag) => {
      const adUnit = allAdUnits.find(u => u.id === tag.adUnitId);
      const code = adUnit?.code || 'ad_unit_slot';
      return {
        adUnitId: tag.adUnitId || adUnit?.id,
        adUnitCode: code,
        name: adUnit?.name || code,
        googleAdUnitId: adUnit?.googleAdUnitId,
        size: tag.size,
        divId: tag.divId,
        gptHeadCode: tag.headCode,
        gptBodyCode: tag.bodyCode,
        completeSnippet: tag.completeCode,
        // Hocalwire standard CMS helper call
        hocalwireSnippet: `window.insertInfiniteDFPAdd("${tag.divId}","'/${networkCode}/${code}', [${tag.size.width}, ${tag.size.height}]");`
      };
    });

    for (const partner of partners) {
      const startTime = Date.now();
      const targetUrl = this.buildPartnerUrl(partner.endpoint, partner.apiPath);

      const payload = {
        event: 'CAMPAIGN_GPT_TAGS_SYNC',
        action: 'SYNC_AD_UNITS',
        source: 'GAM_AUTOMATION_ENGINE',
        's-d': partner.securityToken,
        partnerId: partner.id,
        partnerName: partner.name,
        networkCode,
        campaign: {
          id: campaign.id,
          name: campaign.customName || campaign.advertiserName,
          advertiserName: campaign.advertiserName,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          targetUrl: campaign.targetUrl,
          bannerUrl: campaign.bannerUrl,
          position: campaign.position || 'homepage'
        },
        adUnits: formattedAdUnits,
        timestamp: new Date().toISOString()
      };

      try {
        const response = await axios.post(
          `${targetUrl}?s-d=${encodeURIComponent(partner.securityToken)}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              's-d': partner.securityToken,
              'Authorization': `Bearer ${partner.securityToken}`,
              'X-API-Key': partner.securityToken,
              'User-Agent': 'GAM-Automation-Engine/2.0'
            },
            timeout: 10000,
            validateStatus: () => true // Handle all status codes without throwing
          }
        );

        const duration = Date.now() - startTime;
        const isHttpOk = response.status >= 200 && response.status < 300;

        const syncResult: CmsSyncResult = {
          success: isHttpOk,
          partnerId: partner.id,
          partnerName: partner.name,
          endpoint: targetUrl,
          statusCode: response.status,
          message: isHttpOk
            ? `Pushed ${formattedAdUnits.length} GPT tags to ${partner.name} (HTTP ${response.status})`
            : `Endpoint returned HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 120)}`,
          responseData: response.data,
          durationMs: duration
        };

        // Record in API audit log
        logRepo.create({
          id: `LOG-CMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          campaignId: campaign.id,
          operation: 'CMS_SYNC_CAMPAIGN',
          service: `CMS Partner: ${partner.name}`,
          requestData: {
            targetUrl,
            partnerId: partner.id,
            partnerType: partner.cmsType,
            adUnitCount: formattedAdUnits.length
          },
          responseData: {
            statusCode: response.status,
            body: response.data
          },
          status: isHttpOk ? 'SUCCESS' : 'ERROR',
          errorMessage: isHttpOk ? undefined : `HTTP ${response.status}`,
          durationMs: duration,
          createdAt: new Date().toISOString()
        });

        // Update partner sync health
        cmsPartnerRepo.updateSyncStatus(
          partner.id,
          isHttpOk ? 'SUCCESS' : 'ERROR',
          syncResult.message
        );

        results.push(syncResult);
      } catch (err: any) {
        const duration = Date.now() - startTime;
        const errMsg = err.message || 'Network connection failed';

        const syncResult: CmsSyncResult = {
          success: false,
          partnerId: partner.id,
          partnerName: partner.name,
          endpoint: targetUrl,
          error: errMsg,
          durationMs: duration
        };

        logRepo.create({
          id: `LOG-CMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          campaignId: campaign.id,
          operation: 'CMS_SYNC_CAMPAIGN',
          service: `CMS Partner: ${partner.name}`,
          requestData: { targetUrl, partnerId: partner.id },
          responseData: null,
          status: 'ERROR',
          errorMessage: errMsg,
          durationMs: duration,
          createdAt: new Date().toISOString()
        });

        cmsPartnerRepo.updateSyncStatus(partner.id, 'ERROR', errMsg);
        results.push(syncResult);
      }
    }

    // Update campaign record sync timestamp & status
    const allPassed = results.every(r => r.success);
    campaignRepo.updateCmsSync(campaign.id, allPassed ? 'SYNCED' : 'PARTIAL_FAIL');

    return results;
  }

  /**
   * Pushes ad unit inventory records to active CMS partners
   */
  public static async syncAdUnits(adUnitIds?: string[], specificPartnerId?: string): Promise<CmsSyncResult[]> {
    const allAdUnits = adUnitRepo.list();
    const targetAdUnits = adUnitIds && adUnitIds.length > 0
      ? allAdUnits.filter(u => adUnitIds.includes(u.id))
      : allAdUnits;

    if (targetAdUnits.length === 0) {
      return [{
        success: false,
        partnerId: 'none',
        partnerName: 'None',
        endpoint: '',
        error: 'No ad units available to sync.'
      }];
    }

    let partners: CmsPartner[] = [];
    if (specificPartnerId) {
      const p = cmsPartnerRepo.findById(specificPartnerId);
      if (p) partners = [p];
    } else {
      partners = cmsPartnerRepo.findActive().filter(p => p.autoSyncAdUnits);
    }

    if (partners.length === 0) {
      return [{
        success: true,
        partnerId: 'none',
        partnerName: 'None',
        endpoint: '',
        message: 'No active CMS partners configured for ad unit sync.'
      }];
    }

    const results: CmsSyncResult[] = [];
    const networkCode = config.gam.networkCode || '12345678';

    for (const partner of partners) {
      const startTime = Date.now();
      const targetUrl = this.buildPartnerUrl(partner.endpoint, partner.apiPath);

      const payload = {
        event: 'AD_UNITS_INVENTORY_SYNC',
        action: 'REGISTER_AD_UNITS',
        source: 'GAM_AUTOMATION_ENGINE',
        's-d': partner.securityToken,
        partnerId: partner.id,
        partnerName: partner.name,
        networkCode,
        adUnits: targetAdUnits.map(u => ({
          id: u.id,
          name: u.name,
          code: u.code,
          googleAdUnitId: u.googleAdUnitId,
          sizes: u.sizes,
          hocalwireSnippet: `window.insertInfiniteDFPAdd("ad-${u.code}","'/${networkCode}/${u.code}', [${u.sizes[0]?.width || 300}, ${u.sizes[0]?.height || 250}]");`
        })),
        timestamp: new Date().toISOString()
      };

      try {
        const response = await axios.post(
          `${targetUrl}?s-d=${encodeURIComponent(partner.securityToken)}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              's-d': partner.securityToken,
              'Authorization': `Bearer ${partner.securityToken}`,
              'User-Agent': 'GAM-Automation-Engine/2.0'
            },
            timeout: 10000,
            validateStatus: () => true
          }
        );

        const duration = Date.now() - startTime;
        const isHttpOk = response.status >= 200 && response.status < 300;

        const syncResult: CmsSyncResult = {
          success: isHttpOk,
          partnerId: partner.id,
          partnerName: partner.name,
          endpoint: targetUrl,
          statusCode: response.status,
          message: isHttpOk
            ? `Synced ${targetAdUnits.length} Ad Units to ${partner.name}`
            : `Endpoint returned HTTP ${response.status}`,
          responseData: response.data,
          durationMs: duration
        };

        cmsPartnerRepo.updateSyncStatus(partner.id, isHttpOk ? 'SUCCESS' : 'ERROR', syncResult.message);
        results.push(syncResult);
      } catch (err: any) {
        results.push({
          success: false,
          partnerId: partner.id,
          partnerName: partner.name,
          endpoint: targetUrl,
          error: err.message || 'Connection failed',
          durationMs: Date.now() - startTime
        });
      }
    }

    return results;
  }

  /**
   * Tests connection to a CMS partner endpoint with s-d authentication token
   */
  public static async testPartnerConnection(partnerData: {
    endpoint: string;
    apiPath: string;
    securityToken: string;
    name?: string;
  }): Promise<CmsSyncResult> {
    const startTime = Date.now();
    const targetUrl = this.buildPartnerUrl(partnerData.endpoint, partnerData.apiPath);

    const testPayload = {
      event: 'PING_TEST',
      action: 'TEST_CONNECTION',
      source: 'GAM_AUTOMATION_ENGINE',
      's-d': partnerData.securityToken,
      partnerName: partnerData.name || 'Test Partner',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post(
        `${targetUrl}?s-d=${encodeURIComponent(partnerData.securityToken)}`,
        testPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            's-d': partnerData.securityToken,
            'Authorization': `Bearer ${partnerData.securityToken}`,
            'X-API-Key': partnerData.securityToken,
            'User-Agent': 'GAM-Automation-Engine/2.0'
          },
          timeout: 8000,
          validateStatus: () => true
        }
      );

      const duration = Date.now() - startTime;
      const isHttpOk = response.status >= 200 && response.status < 300;

      return {
        success: isHttpOk,
        partnerId: 'test',
        partnerName: partnerData.name || 'Partner',
        endpoint: targetUrl,
        statusCode: response.status,
        message: isHttpOk
          ? `Connection verified! HTTP ${response.status} OK (${duration}ms)`
          : `Connected to endpoint, returned HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 100)}`,
        responseData: response.data,
        durationMs: duration
      };
    } catch (err: any) {
      return {
        success: false,
        partnerId: 'test',
        partnerName: partnerData.name || 'Partner',
        endpoint: targetUrl,
        error: err.message || 'Failed to reach CMS endpoint',
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Fetches and parses live ad slot elements and placements from the partner website / CMS
   */
  public static async fetchPartnerElements(partnerIdOrUrl?: string): Promise<{
    partner: CmsPartner | null;
    targetUrl: string;
    elements: CmsElement[];
    source: 'LIVE_CRAWL' | 'PRESET_FALLBACK';
  }> {
    let partner: CmsPartner | null = null;
    let targetUrl = '';

    if (partnerIdOrUrl && (partnerIdOrUrl.startsWith('http://') || partnerIdOrUrl.startsWith('https://'))) {
      targetUrl = partnerIdOrUrl;
    } else if (partnerIdOrUrl) {
      partner = cmsPartnerRepo.findById(partnerIdOrUrl);
    }

    if (!partner && !targetUrl) {
      const active = cmsPartnerRepo.findActive();
      partner = active[0] || cmsPartnerRepo.list()[0] || null;
    }

    if (partner && !targetUrl) {
      targetUrl = partner.endpoint.startsWith('http') ? partner.endpoint : `https://${partner.endpoint}`;
    }

    if (!targetUrl) {
      targetUrl = 'https://stagingfederalsite.hocalwire.in';
    }

    const defaultElements: CmsElement[] = [
      {
        id: 'thefederal-header-970x90',
        name: 'Header Banner (970x90)',
        divId: 'div-gpt-ad-1778747909418-0',
        slotCode: 'thefederal/Header',
        fullSlotPath: '/22665183713/thefederal/Header',
        networkCode: '22665183713',
        width: 970,
        height: 90,
        rawCall: `insertInfiniteDFPAdd("div-gpt-ad-1778747909418-0","'/22665183713/thefederal/Header', [970, 90]")`,
        sourceUrl: targetUrl
      },
      {
        id: 'thefederal-homepage-728x90',
        name: 'Homepage Leaderboard (728x90)',
        divId: 'div-gpt-ad-1778746743301-0',
        slotCode: 'thefederal/homepage',
        fullSlotPath: '/22665183713/thefederal/homepage',
        networkCode: '22665183713',
        width: 728,
        height: 90,
        rawCall: `insertInfiniteDFPAdd("div-gpt-ad-1778746743301-0","'/22665183713/thefederal/homepage', [728, 90]")`,
        sourceUrl: targetUrl
      },
      {
        id: 'thefederal-hp-320x50',
        name: 'Homepage Mobile (320x50)',
        divId: 'div-gpt-ad-1778747650303-0',
        slotCode: 'thefederal/HP',
        fullSlotPath: '/22665183713/thefederal/HP',
        networkCode: '22665183713',
        width: 320,
        height: 50,
        rawCall: `insertInfiniteDFPAdd("div-gpt-ad-1778747650303-0","'/22665183713/thefederal/HP', [320, 50]")`,
        sourceUrl: targetUrl
      },
      {
        id: 'thefederal-category-250x250',
        name: 'Category Mobile (250x250)',
        divId: 'div-gpt-ad-1778748588881-0',
        slotCode: 'thefederal/eng_250x250_mobile_categorypage',
        fullSlotPath: '/22665183713/thefederal/eng_250x250_mobile_categorypage',
        networkCode: '22665183713',
        width: 250,
        height: 250,
        rawCall: `insertInfiniteDFPAdd("div-gpt-ad-1778748588881-0","'/22665183713/thefederal/eng_250x250_mobile_categorypage', [250, 250]")`,
        sourceUrl: targetUrl
      }
    ];

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      });

      const html = String(response.data || '');
      const cleaned = html
        .replace(/%22/g, '"')
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .replace(/%2F/g, '/')
        .replace(/%5B/g, '[')
        .replace(/%5D/g, ']');

      const regex = /insertInfiniteDFPAdd\(([^)]+)\)/g;
      let match;
      const elements: CmsElement[] = [];
      const seen = new Set<string>();

      while ((match = regex.exec(cleaned)) !== null) {
        const raw = match[1];
        if (!seen.has(raw)) {
          seen.add(raw);
          const parts = raw.split(',');
          const divId = (parts[0] || '').replace(/["']/g, '').trim();
          const slotMatch = raw.match(/'(\/[^']+)'/);
          const sizeMatch = raw.match(/\[(\d+),\s*(\d+)\]/);
          const fullSlot = slotMatch ? slotMatch[1] : '';
          const slotParts = fullSlot.split('/').filter(Boolean);
          const netCode = slotParts[0] || (partner?.endpoint.includes('federal') ? '22665183713' : '22068249324');
          const slotName = slotParts.slice(1).join('/') || 'ad_slot';
          const w = sizeMatch ? parseInt(sizeMatch[1], 10) : 300;
          const h = sizeMatch ? parseInt(sizeMatch[2], 10) : 250;

          elements.push({
            id: `el_${divId || slotName.replace(/[^a-z0-9]/gi, '_')}`,
            name: `${slotName} (${w}x${h})`,
            divId: divId || `div-gpt-ad-${Date.now()}`,
            slotCode: slotName,
            fullSlotPath: fullSlot,
            networkCode: netCode,
            width: w,
            height: h,
            rawCall: `insertInfiniteDFPAdd(${raw})`,
            sourceUrl: targetUrl
          });
        }
      }

      if (elements.length > 0) {
        return {
          partner,
          targetUrl,
          elements,
          source: 'LIVE_CRAWL'
        };
      }
    } catch (err: any) {
      console.warn(`Failed to live-crawl elements from ${targetUrl}:`, err.message);
    }

    // Return verified elements if site didn't return matches or timed out
    return {
      partner,
      targetUrl,
      elements: defaultElements,
      source: 'PRESET_FALLBACK'
    };
  }

  /**
   * Pushes generated DFP code for a selected element directly to the selected partner CMS
   */
  public static async pushElementDfp(params: {
    partnerId?: string;
    element: Partial<CmsElement> & { divId: string; slotCode: string; width: number; height: number };
    networkCode?: string;
    customSnippet?: string;
  }): Promise<PushDfpResult> {
    const startTime = Date.now();
    let partner = params.partnerId ? cmsPartnerRepo.findById(params.partnerId) : null;
    if (!partner) {
      partner = cmsPartnerRepo.findActive()[0] || cmsPartnerRepo.list()[0];
    }

    if (!partner) {
      throw new Error('No partner configured to push DFP code to.');
    }

    const netCode = (params.networkCode || (partner.endpoint.includes('federal') ? '22665183713' : config.gam.networkCode || '22068249324')).trim();
    const cleanSlot = params.element.slotCode.replace(/^\//, '');
    const divId = params.element.divId;
    const width = params.element.width;
    const height = params.element.height;

    // Build the official DFP snippet
    const hocalwireSnippet = params.customSnippet || `window.insertInfiniteDFPAdd("${divId}","'/${netCode}/${cleanSlot}', [${width}, ${height}]");`;
    const gptTags = generateGPTTags(netCode, cleanSlot, { width, height }, divId);

    const fullTargetUrl = this.buildPartnerUrl(partner.endpoint, partner.apiPath);

    const payload = {
      event: 'PUSH_DFP_CODE',
      action: 'UPDATE_SLOT_DFP',
      source: 'GAM_AUTOMATION_ENGINE',
      's-d': partner.securityToken,
      partnerId: partner.id,
      partnerName: partner.name,
      networkCode: netCode,
      element: {
        divId,
        slotCode: cleanSlot,
        fullSlotPath: `/${netCode}/${cleanSlot}`,
        width,
        height
      },
      dfpCode: {
        hocalwireSnippet,
        divId,
        headCode: gptTags.headCode,
        bodyCode: gptTags.bodyCode,
        completeCode: gptTags.completeCode
      },
      timestamp: new Date().toISOString()
    };

    let isHttpOk = false;
    let statusCode: number | undefined;
    let responseData: any = null;
    let errorMsg: string | undefined;

    try {
      const response = await axios.post(
        `${fullTargetUrl}?s-d=${encodeURIComponent(partner.securityToken)}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            's-d': partner.securityToken,
            'Authorization': `Bearer ${partner.securityToken}`,
            'X-API-Key': partner.securityToken,
            'User-Agent': 'GAM-Automation-Engine/2.0'
          },
          timeout: 10000,
          validateStatus: () => true
        }
      );

      statusCode = response.status;
      responseData = response.data;
      isHttpOk = response.status >= 200 && response.status < 300;
    } catch (err: any) {
      errorMsg = err.message || 'Connection failed';
    }

    const duration = Date.now() - startTime;

    // Log to API audit logs
    logRepo.create({
      id: `LOG-PUSH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      operation: 'CMS_PUSH_ELEMENT_DFP',
      service: `Partner: ${partner.name}`,
      requestData: {
        targetUrl: fullTargetUrl,
        divId,
        slotCode: cleanSlot,
        size: `${width}x${height}`
      },
      responseData: {
        statusCode,
        body: responseData
      },
      status: isHttpOk ? 'SUCCESS' : 'ERROR',
      errorMessage: isHttpOk ? undefined : (errorMsg || `HTTP ${statusCode}`),
      durationMs: duration,
      createdAt: new Date().toISOString()
    });

    const message = isHttpOk
      ? `Successfully pushed DFP code for "${cleanSlot}" to ${partner.name} (HTTP ${statusCode})`
      : `Dispatched DFP code to ${partner.name}. Target endpoint responded with HTTP ${statusCode || 'Error'}`;

    return {
      success: isHttpOk,
      partnerId: partner.id,
      partnerName: partner.name,
      endpoint: fullTargetUrl,
      element: {
        id: `el_${divId}`,
        name: `${cleanSlot} (${width}x${height})`,
        divId,
        slotCode: cleanSlot,
        fullSlotPath: `/${netCode}/${cleanSlot}`,
        networkCode: netCode,
        width,
        height,
        rawCall: hocalwireSnippet,
        sourceUrl: fullTargetUrl
      },
      networkCode: netCode,
      generatedSnippet: hocalwireSnippet,
      headCode: gptTags.headCode,
      bodyCode: gptTags.bodyCode,
      completeCode: gptTags.completeCode,
      statusCode,
      responseData,
      message,
      error: errorMsg,
      timestamp: new Date().toISOString()
    };
  }
}

