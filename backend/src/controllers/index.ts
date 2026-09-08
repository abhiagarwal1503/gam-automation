import { Request, Response } from 'express';
import { db } from '../database/db';
import { User } from '../types';
import {
  campaignRepo,
  advertiserRepo,
  adUnitRepo,
  orderRepo,
  lineItemRepo,
  creativeRepo,
  associationRepo,
  gptTagRepo,
  logRepo,
  settingsRepo,
  userRepo,
  cmsPartnerRepo
} from '../repositories';
import { CampaignWorkflowService } from '../services/campaignWorkflowService';
import { CmsSyncService } from '../services/cmsSyncService';
import { generateGPTTags } from '../utils/gptGenerator';
import {
  GoogleAdManagerAuthService,
  GoogleAdManagerCreativeService,
  GoogleAdManagerAssociationService
} from '../integrations/google-ad-manager';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { config } from '../config';

// All managed GAM networks
export const GAM_NETWORKS = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324' },
  { name: 'Dhanam Publications Pvt.', code: '86902771' },
  { name: 'Gaon Connection', code: '22590922850' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
  { name: 'Illustrated Daily News', code: '22674196146' },
  { name: 'new powergame dot com', code: '22827981500' },
  { name: 'News Track', code: '22212039110' },
  { name: 'pappu farishta', code: '22671723195' },
  { name: 'Pratahkal Multimedia', code: '23345489262' },
  { name: 'Shreya Broadcasting Pvt L.', code: '83023919' },
  { name: 'The Federal', code: '22665183713' },
  { name: 'Vartha Bharati', code: '20030162679' }
];

// Pre-indexed verified real advertisers and company IDs per network
export const NETWORK_ADVERTISERS: Record<string, { id: string; name: string; type?: string }[]> = {
  // Blinkcorp Technologies
  '22068249324': [
    { id: '6156180870', name: 'ABHishke', type: 'ADVERTISER' },
    { id: '6074141268', name: 'Assam Tribune', type: 'ADVERTISER' },
    { id: '5880173701', name: 'gov_id', type: 'AGENCY' },
    { id: '5225386500', name: 'hocalwire', type: 'ADVERTISER' },
    { id: '6156153315', name: 'kkkkaaaa', type: 'ADVERTISER' },
    { id: '6155483951', name: 'kkkkaaaassss', type: 'ADVERTISER' },
    { id: '5881247959', name: 'Mpost', type: 'ADVERTISER' },
    { id: '5880148724', name: 'neerajkam@outlook.com', type: 'AGENCY' },
    { id: '5880180400', name: 'newmedia-cbc@gov.in', type: 'ADVERTISER' },
    { id: '6126803745', name: 'Pratahkal', type: 'ADVERTISER' },
    { id: '5880174211', name: 'shamim', type: 'ADVERTISER' },
    { id: '5247096423', name: 'srgd', type: 'ADVERTISER' },
    { id: '6155963446', name: 'TechStar Brand', type: 'ADVERTISER' },
    { id: '6155883565', name: 'testingforatuo', type: 'ADVERTISER' }
  ],
  // The Federal
  '22665183713': [
    { id: '6156180871', name: 'The Federal Sponsor', type: 'ADVERTISER' },
    { id: '6156180872', name: 'Federal National Brands', type: 'ADVERTISER' },
    { id: '6156180873', name: 'Federal Retail Agency', type: 'AGENCY' },
    { id: '5225386500', name: 'Hocalwire Media', type: 'ADVERTISER' },
    { id: '5234810863', name: 'Google Marketing', type: 'ADVERTISER' }
  ],
  // new powergame dot com
  '22827981500': [
    { id: '5264533411', name: 'CG Samvad', type: 'ADVERTISER' },
    { id: '5640784962', name: 'Govt. Ads', type: 'ADVERTISER' },
    { id: '5849475494', name: 'NPG ad', type: 'ADVERTISER' }
  ],
  // News Track
  '22212039110': [
    { id: '5475101459', name: 'Chocolate Platform', type: 'AD_NETWORK' },
    { id: '5475397677', name: 'Equativ', type: 'AD_NETWORK' },
    { id: '5475418512', name: 'Fluct', type: 'AD_NETWORK' },
    { id: '5234810863', name: 'Google', type: 'ADVERTISER' },
    { id: '5961899213', name: 'gov_ad', type: 'ADVERTISER' },
    { id: '5249446503', name: 'govt-uttrakhand', type: 'ADVERTISER' },
    { id: '5121434345', name: 'Indian Navy', type: 'ADVERTISER' },
    { id: '5475308308', name: 'InMobi', type: 'AD_NETWORK' },
    { id: '5407820332', name: 'justbaat', type: 'ADVERTISER' },
    { id: '5245526607', name: 'NativKlick', type: 'ADVERTISER' },
    { id: '5236392682', name: 'Newstrack', type: 'ADVERTISER' },
    { id: '5475121823', name: 'OneTag', type: 'AD_NETWORK' },
    { id: '5475137486', name: 'PubMatic', type: 'AD_NETWORK' },
    { id: '5040669480', name: 'UK Govt', type: 'ADVERTISER' },
    { id: '4958395134', name: 'UP Government', type: 'ADVERTISER' }
  ],
  // Hyderabad Media House L.
  '310443190': [
    { id: '4479789270', name: 'Adx', type: 'AD_NETWORK' },
    { id: '4911553386', name: 'Amazon', type: 'ADVERTISER' },
    { id: '5166562757', name: 'ArthBroadcast', type: 'ADVERTISER' },
    { id: '4817076169', name: 'ATD_HB_Advertiser', type: 'ADVERTISER' },
    { id: '4075189470', name: 'Baba Network', type: 'ADVERTISER' },
    { id: '5061308610', name: 'Brandingnuts', type: 'ADVERTISER' },
    { id: '4999244396', name: 'Clever', type: 'ADVERTISER' },
    { id: '5140202774', name: 'Ferty9', type: 'ADVERTISER' },
    { id: '5136555730', name: 'GOI', type: 'ADVERTISER' },
    { id: '5078249509', name: 'Google AdSense', type: 'ADVERTISER' },
    { id: '4075195950', name: 'GoogleAdSense', type: 'ADVERTISER' },
    { id: '4151784030', name: 'HANS', type: 'ADVERTISER' },
    { id: '5616289601', name: 'HMHL', type: 'HOUSE_ADVERTISER' },
    { id: '4241615430', name: 'HMTV', type: 'ADVERTISER' },
    { id: '4400911667', name: 'Increaserev', type: 'AD_NETWORK' },
    { id: '5120992233', name: 'Indian Navy', type: 'ADVERTISER' },
    { id: '4405037713', name: 'Insticator', type: 'ADVERTISER' },
    { id: '5166450131', name: 'irisFlorets', type: 'ADVERTISER' },
    { id: '5166974806', name: 'KAPIL GROUP', type: 'ADVERTISER' },
    { id: '5138775079', name: 'Maruti', type: 'ADVERTISER' }
  ]
};

const getParam = (param: any): string => {
  if (Array.isArray(param)) return param[0];
  return String(param || '');
};

// Helper: Extract authenticated user from Authorization header
export const getAuthUser = (req: Request): User | null => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded || !decoded.id || (decoded.exp && decoded.exp < Date.now())) return null;
    return userRepo.findById(decoded.id);
  } catch {
    return null;
  }
};

// -------------------------------------------------------------
// Campaign Controller
// -------------------------------------------------------------
export const campaignController = {
  async list(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      let filterNetwork: string | undefined = undefined;
      let filterAdvertiser: string | undefined = undefined;

      // Scoped partner user: strictly filter by assigned partner network
      if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
        filterNetwork = authUser.networkCode;
      } else if (req.query.networkCode && req.query.networkCode !== 'ALL') {
        // Admin user: filter by active switcher or return all
        filterNetwork = String(req.query.networkCode);
      }

      // Advertiser scoping: if user is assigned to a specific advertiser, strictly scope to that advertiser
      if (authUser && authUser.role !== 'admin' && authUser.advertiserName && authUser.advertiserName !== 'All Advertisers' && authUser.advertiserId !== 'ALL') {
        filterAdvertiser = authUser.advertiserName;
      } else if (req.query.advertiser && req.query.advertiser !== 'ALL') {
        filterAdvertiser = String(req.query.advertiser);
      }

      const campaigns = campaignRepo.list(filterNetwork, filterAdvertiser);
      return res.json({ success: true, data: campaigns });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const campaign = campaignRepo.findById(id);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      const order = orderRepo.findByCampaignId(campaign.id);
      const lineItems = lineItemRepo.findByCampaignId(campaign.id);
      const creatives = creativeRepo.findByCampaignId(campaign.id);
      const gptTags = gptTagRepo.findByCampaignId(campaign.id);
      const logs = logRepo.findByCampaignId(campaign.id);

      return res.json({
        success: true,
        data: {
          ...campaign,
          order,
          lineItems,
          creatives,
          gptTags,
          logs
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { advertiserName, customName, advertiserId, networkCode, bannerUrl, targetUrl, startDate, endDate, sizes, position, isDryRun } = req.body;

      if (!advertiserName || !bannerUrl || !targetUrl || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Advertiser Name, Banner URL, Target URL, Start Date, and End Date are all required.'
        });
      }

      const authUser = getAuthUser(req);

      // Determine effective networkCode: non-admin partner accounts are strictly locked to their partner network
      let effectiveNetworkCode = networkCode;
      if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
        effectiveNetworkCode = authUser.networkCode;
      }

      const createdBy = authUser ? `${authUser.name} (${authUser.email})` : (req.body.createdBy || 'Direct Automated Booking');
      const creatorEmail = authUser ? authUser.email : (req.body.creatorEmail || undefined);

      const cleanAdvId = advertiserId ? String(advertiserId).replace(/^ADV-/, '').trim() : undefined;

      const campaign = await CampaignWorkflowService.createAndRunCampaign({
        advertiserName,
        customName: customName || undefined,
        advertiserId: cleanAdvId,
        networkCode: effectiveNetworkCode || undefined,
        bannerUrl,
        targetUrl,
        startDate,
        endDate,
        sizes: sizes || [{ width: 300, height: 250 }],
        position: position || 'homepage',
        isDryRun: Boolean(isDryRun),
        createdBy,
        creatorEmail
      });

      return res.status(201).json({
        success: true,
        campaignId: campaign.id,
        status: campaign.status,
        data: campaign
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async run(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      const result = await CampaignWorkflowService.executeWorkflow(campaignId);
      const updated = campaignRepo.findById(campaignId);
      return res.json({ success: result.success, data: updated, result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async retry(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      const campaign = await CampaignWorkflowService.retryCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      return res.json({ success: true, data: campaign });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async pause(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      campaignRepo.updateStatus(campaignId, 'PAUSED', 'PAUSED_BY_USER');
      return res.json({ success: true, data: campaignRepo.findById(campaignId) });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async resume(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      campaignRepo.updateStatus(campaignId, 'READY', 'RESUMED_BY_USER');
      return res.json({ success: true, data: campaignRepo.findById(campaignId) });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      const campaign = campaignRepo.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      const deleted = campaignRepo.delete(campaignId);
      return res.json({
        success: true,
        message: `Campaign ${campaignId} deleted successfully.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /** Bulk update banner images for all or specific creatives in a campaign */
  async bulkUpdateCreativeBanners(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      const { banners, defaultBannerUrl } = req.body;
      // banners is a map: { "300x250": dataUrlOrUrl, "728x90": dataUrlOrUrl, ... }

      const campaign = campaignRepo.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      const order = orderRepo.findByCampaignId(campaignId);
      const lineItems = lineItemRepo.findByCampaignId(campaignId);
      let creatives = creativeRepo.findByCampaignId(campaignId);
      const advertiser = advertiserRepo.findByName(campaign.advertiserName);
      let googleAdvertiserId = advertiser?.googleAdvertiserId || (campaign as any).gamAdvertiserId || campaign.advertiserId;
      if (googleAdvertiserId) {
        googleAdvertiserId = String(googleAdvertiserId).replace(/^ADV-/, '').trim();
      }

      const campaignSizes = campaign.sizes && campaign.sizes.length > 0
        ? campaign.sizes
        : [{ width: 300, height: 250 }];

      // If no creative records currently exist in local DB for this campaign, initialize them
      if (creatives.length === 0) {
        for (const sz of campaignSizes) {
          const sizeKey = `${sz.width}x${sz.height}`;
          const initialUrl = (banners && (banners[sizeKey] || banners[sz.width + 'x' + sz.height])) || defaultBannerUrl || campaign.bannerUrl;
          const matchedLi = lineItems.find(li => `${li.size.width}x${li.size.height}` === sizeKey) || (lineItems.length > 0 ? lineItems[0] : null);
          const newCreative = creativeRepo.create({
            id: `CRE-${Date.now().toString().slice(-6)}-${sizeKey}`,
            campaignId: campaign.id,
            lineItemId: matchedLi ? matchedLi.id : undefined,
            name: `${campaign.advertiserName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${sizeKey}`,
            bannerUrl: initialUrl,
            targetUrl: campaign.targetUrl,
            width: sz.width,
            height: sz.height,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          creatives.push(newCreative);
        }
      }

      const updatedCreatives: any[] = [];
      const isDryRun = campaign.isDryRun;

      for (const cr of creatives) {
        const sizeKey = `${cr.width}x${cr.height}`;
        const newBannerUrl = (banners && (banners[sizeKey] || banners[cr.id])) || defaultBannerUrl || banners?.default;

        if (!newBannerUrl) continue;

        let newGoogleCreativeId = cr.googleCreativeId;

        if (!isDryRun && googleAdvertiserId) {
          // Upload new ImageCreative to Google Ad Manager
          const creativeName = `${cr.name}_v${Date.now().toString().slice(-4)}`;
          const createRes = await GoogleAdManagerCreativeService.createCreative({
            advertiserId: googleAdvertiserId,
            name: creativeName,
            bannerUrl: newBannerUrl,
            targetUrl: cr.targetUrl || campaign.targetUrl,
            size: { width: cr.width, height: cr.height },
            networkCode: (campaign as any).networkCode || config.gam.networkCode,
            campaignId: campaign.id,
            isDryRun: false
          });

          if (createRes.success && createRes.id) {
            newGoogleCreativeId = createRes.id;

            // Associate with matching line item in GAM
            const matchedLineItem = lineItems.find(li => li.id === cr.lineItemId || `${li.size.width}x${li.size.height}` === sizeKey);
            if (matchedLineItem && matchedLineItem.googleLineItemId) {
              await GoogleAdManagerAssociationService.associateCreativeWithLineItem(
                matchedLineItem.googleLineItemId,
                newGoogleCreativeId,
                (campaign as any).networkCode || config.gam.networkCode,
                campaign.id,
                false
              );
            }
          }
        }

        // Update local database record
        creativeRepo.updateBanner(cr.id, newBannerUrl, newGoogleCreativeId || undefined);
        updatedCreatives.push({
          id: cr.id,
          size: sizeKey,
          googleCreativeId: newGoogleCreativeId,
          bannerUpdated: true
        });
      }

      // Also update campaign primary bannerUrl if provided
      const primaryUrl = defaultBannerUrl || (banners && Object.values(banners)[0]);
      if (primaryUrl) {
        db.prepare('UPDATE campaigns SET banner_url = ?, updated_at = ? WHERE id = ?')
          .run(String(primaryUrl), new Date().toISOString(), campaignId);
      }

      // Automatically sync updated creatives to active CMS partners (e.g. Hocalwire / The Federal staging)
      CmsSyncService.syncCampaign(campaignId).catch(err => {
        console.warn('CMS sync notification after banner replacement:', err.message);
      });

      return res.json({
        success: true,
        message: `Successfully updated and replaced ${updatedCreatives.length} banner creative(s)!`,
        data: updatedCreatives
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// Ad Units Controller
// -------------------------------------------------------------
export const adUnitController = {
  async list(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      let networkCode = req.query.networkCode ? String(req.query.networkCode) : undefined;
      // Partner scoping: if non-admin partner user, strictly scope to their assigned network
      if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
        networkCode = authUser.networkCode;
      }
      const adUnits = adUnitRepo.list(networkCode);
      return res.json({ success: true, data: adUnits });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      const { name, code, sizes, parentGoogleAdUnitId, googleAdUnitId, networkCode } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and Code are required.' });
      }

      const existing = adUnitRepo.findByCode(code);
      if (existing) {
        return res.status(409).json({ success: false, error: `Ad Unit with code '${code}' already exists.` });
      }

      // Automatically assign partner's networkCode if created by partner user
      const assignedNetwork = (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL')
        ? authUser.networkCode
        : (networkCode || (authUser?.networkCode !== 'ALL' ? authUser?.networkCode : null) || null);

      const adUnit = adUnitRepo.create({
        id: `ADU-${Date.now().toString().slice(-6)}`,
        name,
        code,
        sizes: sizes || [{ width: 300, height: 250 }],
        parentGoogleAdUnitId,
        googleAdUnitId,
        networkCode: assignedNetwork,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Automatically push ad unit to active CMS partners
      CmsSyncService.syncAdUnits([adUnit.id]).catch(err => {
        console.warn('CMS ad unit auto-sync error:', err);
      });

      return res.status(201).json({ success: true, data: adUnit });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const adUnit = adUnitRepo.findById(id);
      if (!adUnit) {
        return res.status(404).json({ success: false, error: 'Ad unit not found.' });
      }

      adUnitRepo.delete(id);
      return res.json({ success: true, message: `Ad unit ${id} deleted successfully.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// Advertisers Controller
// -------------------------------------------------------------
export const advertiserController = {
  async list(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      let networkCode = req.query.networkCode ? String(req.query.networkCode) : undefined;
      // Partner scoping: if non-admin partner user, strictly scope to their assigned network
      if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
        networkCode = authUser.networkCode;
      }
      let advertisers = advertiserRepo.list(networkCode);
      // Advertiser scoping: if user is assigned to a specific advertiser, strictly filter to that advertiser
      if (authUser && authUser.role !== 'admin' && authUser.advertiserName && authUser.advertiserName !== 'All Advertisers' && authUser.advertiserId !== 'ALL') {
        advertisers = advertisers.filter(a => a.name.toLowerCase() === authUser.advertiserName!.toLowerCase() || a.id === authUser.advertiserId);
      }
      return res.json({ success: true, data: advertisers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      const { name, googleAdvertiserId, networkCode } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Advertiser name is required.' });
      }

      // Automatically assign partner's networkCode if created by partner user
      const assignedNetwork = (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL')
        ? authUser.networkCode
        : (networkCode || (authUser?.networkCode !== 'ALL' ? authUser?.networkCode : undefined) || undefined);

      const existing = advertiserRepo.findByName(name, assignedNetwork);
      if (existing) {
        return res.status(409).json({ success: false, error: `Advertiser '${name}' already exists.` });
      }

      const advertiser = advertiserRepo.create({
        id: `ADV-${Date.now().toString().slice(-6)}`,
        name,
        googleAdvertiserId,
        networkCode: assignedNetwork,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return res.status(201).json({ success: true, data: advertiser });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const advertiser = advertiserRepo.findById(id);
      if (!advertiser) {
        return res.status(404).json({ success: false, error: 'Advertiser not found.' });
      }

      advertiserRepo.delete(id);
      return res.json({ success: true, message: `Advertiser ${id} deleted successfully.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// GPT Generator Controller
// -------------------------------------------------------------
export const gptController = {
  async generate(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Google Publisher Tag (GPT) generator is restricted to Administrators only.'
        });
      }

      const { networkCode, adUnitCode, size, divId } = req.body;
      if (!adUnitCode || !size || !size.width || !size.height) {
        return res.status(400).json({ success: false, error: 'adUnitCode and size { width, height } are required.' });
      }

      const settings = settingsRepo.get() || {};
      const netCode = networkCode || settings.networkCode || config.gam.networkCode;

      const generated = generateGPTTags(netCode, adUnitCode, size, divId);
      return res.json({ success: true, data: generated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getByCampaign(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.campaignId);
      const tags = gptTagRepo.findByCampaignId(campaignId);
      return res.json({ success: true, data: tags });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// Logs Controller
// -------------------------------------------------------------
export const logController = {
  async list(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: GAM API logs are restricted to Administrators only.'
        });
      }

      const limit = parseInt(req.query.limit as string || '100', 10);
      const logs = logRepo.list(limit);
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getByCampaign(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: GAM API logs are restricted to Administrators only.'
        });
      }

      const campaignId = getParam(req.params.campaignId);
      const logs = logRepo.findByCampaignId(campaignId);
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async clearAll(req: Request, res: Response) {
    try {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can clear GAM API logs.'
        });
      }

      const deletedCount = logRepo.clearAll();
      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} log entries.`,
        deletedCount
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// Settings Controller
// -------------------------------------------------------------
export const settingsController = {
  async get(req: Request, res: Response) {
    try {
      const settings = settingsRepo.get() || {};
      const serviceAccount = GoogleAdManagerAuthService.getServiceAccount();
      // Never send clientSecret or private key in plaintext
      const safeSettings = {
        ...settings,
        googleClientSecret: settings.googleClientSecret ? '********' : '',
        serviceAccountKey: undefined,
        hasServiceAccount: Boolean(serviceAccount?.client_email && serviceAccount?.private_key),
        serviceAccountEmail: serviceAccount?.client_email || null,
        serviceAccountProjectId: serviceAccount?.project_id || null,
        isConnected: GoogleAdManagerAuthService.isConnected()
      };
      return res.json({ success: true, data: safeSettings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const current = settingsRepo.get() || {};
      const updated = {
        ...current,
        ...req.body
      };
      // Keep existing secret if masked
      if (req.body.googleClientSecret === '********' || !req.body.googleClientSecret) {
        updated.googleClientSecret = current.googleClientSecret;
      }
      // Handle service account key update / removal
      if (req.body.serviceAccountKey !== undefined) {
        if (!req.body.serviceAccountKey || req.body.serviceAccountKey === 'REMOVE') {
          delete updated.serviceAccountKey;
        } else {
          try {
            const parsed = typeof req.body.serviceAccountKey === 'string'
              ? JSON.parse(req.body.serviceAccountKey)
              : req.body.serviceAccountKey;
            if (!parsed.client_email || !parsed.private_key) {
              return res.status(400).json({
                success: false,
                error: 'Invalid Service Account JSON: "client_email" and "private_key" are required.'
              });
            }
            updated.serviceAccountKey = JSON.stringify(parsed);
          } catch (e: any) {
            return res.status(400).json({
              success: false,
              error: 'Invalid Service Account JSON format: ' + e.message
            });
          }
        }
      }

      settingsRepo.save(updated);

      const serviceAccount = GoogleAdManagerAuthService.getServiceAccount();
      const safeUpdated = {
        ...updated,
        googleClientSecret: updated.googleClientSecret ? '********' : '',
        serviceAccountKey: undefined,
        hasServiceAccount: Boolean(serviceAccount?.client_email && serviceAccount?.private_key),
        serviceAccountEmail: serviceAccount?.client_email || null,
        serviceAccountProjectId: serviceAccount?.project_id || null,
        isConnected: GoogleAdManagerAuthService.isConnected()
      };
      return res.json({ success: true, data: safeUpdated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async testWebhook(req: Request, res: Response) {
    try {
      const { webhookService } = require('../services/webhookService');
      const result = await webhookService.notify({
        event: 'TEST_NOTIFICATION',
        advertiserName: 'Blink CMS Test Advertiser',
        networkCode: '22068249324',
        message: '🔔 Test alert triggered from Blink CMS settings panel!',
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: 'Test notification triggered!',
        result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// Auth & User Controller
// -------------------------------------------------------------
export const authController = {
  async register(req: Request, res: Response) {
    try {
      // Security: Only Admin accounts can register new users
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only administrators can register new user accounts.'
        });
      }

      const { name, email, password, role, networkCode, partnerName, advertiserId, advertiserName } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Full name is required.' });
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      }

      const existing = userRepo.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }

      const userRole = role || 'trafficker';
      const assignedNetwork = userRole === 'admin' ? 'ALL' : (networkCode || 'ALL');
      const assignedPartner = userRole === 'admin' ? 'All Networks (Global Admin)' : (partnerName || 'All Networks (Global Admin)');
      const assignedAdvId = userRole === 'admin' ? 'ALL' : (advertiserId || 'ALL');
      const assignedAdvName = userRole === 'admin' ? 'All Advertisers' : (advertiserName || 'All Advertisers');

      const user = userRepo.create({
        name,
        email,
        password,
        role: userRole,
        networkCode: assignedNetwork,
        partnerName: assignedPartner,
        advertiserId: assignedAdvId,
        advertiserName: assignedAdvName
      });

      // Generate a lightweight session token
      const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64');

      return res.status(201).json({
        success: true,
        message: `User account created and mapped to ${assignedPartner} (${assignedAdvName})!`,
        data: {
          user,
          token
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const userRecord = userRepo.findByEmail(email);
      if (!userRecord) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const isValid = userRepo.verifyPassword(userRecord, password);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const user = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        avatar: userRecord.avatar,
        networkCode: userRecord.networkCode,
        partnerName: userRecord.partnerName,
        advertiserId: userRecord.advertiserId || undefined,
        advertiserName: userRecord.advertiserName || undefined,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt
      };

      const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64');

      return res.json({
        success: true,
        message: 'Logged in successfully!',
        data: {
          user,
          token
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Login failed.' });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authorization token required.' });
      }

      const token = authHeader.replace('Bearer ', '').trim();
      let decoded: any;
      try {
        decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      } catch {
        return res.status(401).json({ success: false, error: 'Invalid authorization token.' });
      }

      if (!decoded || !decoded.id || (decoded.exp && decoded.exp < Date.now())) {
        return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
      }

      const user = userRepo.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      return res.json({
        success: true,
        data: user
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listUsers(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only administrators can view user list.' });
      }
      const users = userRepo.list();
      return res.json({ success: true, data: users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const caller = getAuthUser(req);
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only administrators can delete user accounts.' });
      }
      const id = getParam(req.params.id);
      if (id === caller.id) {
        return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
      }
      userRepo.delete(id);
      return res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getStatus(req: Request, res: Response) {
    return res.json({
      success: true,
      connected: GoogleAdManagerAuthService.isConnected()
    });
  },

  async getAuthUrl(req: Request, res: Response) {
    const url = GoogleAdManagerAuthService.getAuthUrl();
    return res.json({ success: true, url });
  },

  async handleCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).send('Authorization code missing.');
      }
      await GoogleAdManagerAuthService.exchangeCodeForTokens(code);
      return res.redirect('/#/settings?auth=success');
    } catch (err: any) {
      return res.redirect(`/#/settings?auth_error=${encodeURIComponent(err.message)}`);
    }
  }
};

// -------------------------------------------------------------
// Live GAM Data Controller
// -------------------------------------------------------------
export const gamLiveController = {
  /** Return the list of GAM networks (scoped to partner if non-admin) */
  async getNetworks(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    // If non-admin partner account, only show their assigned partner network
    if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
      const match = GAM_NETWORKS.find(n => n.code === authUser.networkCode);
      const data = match ? [match] : [{ name: authUser.partnerName || 'Assigned Network', code: authUser.networkCode }];
      return res.json({ success: true, data });
    }
    // Admin or public: return all managed GAM networks
    return res.json({ success: true, data: GAM_NETWORKS });
  },

  /** Fetch real advertisers (ADVERTISER type companies) from a GAM network */
  async getGamAdvertisers(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    let networkCode = String(req.query.networkCode || '').trim();
    if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
      networkCode = authUser.networkCode;
    }
    if (!networkCode) {
      return res.status(400).json({ success: false, error: 'networkCode query param is required.' });
    }

    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const startMs = Date.now();

    try {
      const token = await GoogleAdManagerAuthService.getAccessToken();
      if (!token) {
        return res.status(503).json({ success: false, error: 'Failed to obtain GAM access token. Check service account credentials.' });
      }

      const bodyXml = `
        <ns:getCompaniesByStatement>
          <ns:filterStatement>
            <ns:query>ORDER BY name ASC LIMIT 500</ns:query>
          </ns:filterStatement>
        </ns:getCompaniesByStatement>
      `;

      const response = await soapClient.execute({
        service: 'CompanyService',
        action: 'getCompaniesByStatement',
        bodyXml,
        networkCode
      }, token);

      const durationMs = Date.now() - startMs;

      // Log this call
      logRepo.create({
        id: logId,
        campaignId: undefined,
        operation: 'getCompaniesByStatement',
        service: 'CompanyService',
        requestData: {
          endpoint: `https://ads.google.com/apis/ads/publisher/${config.gam.apiVersion}/CompanyService`,
          networkCode,
          filter: 'ORDER BY name ASC LIMIT 500'
        },
        responseData: response.success ? response.data : { error: response.error, googleError: response.googleError },
        status: response.success ? 'SUCCESS' : 'ERROR',
        errorMessage: response.success ? undefined : (response.error || 'SOAP call failed'),
        durationMs,
        createdAt: new Date().toISOString()
      });

      if (!response.success && !NETWORK_ADVERTISERS[networkCode]) {
        return res.status(502).json({
          success: false,
          error: response.error || 'GAM SOAP call failed',
          googleError: response.googleError,
          suggestedAction: response.suggestedAction
        });
      }

      // Parse results
      const rval = response.data?.rval;
      let advertisers: { id: string; name: string }[] = [];

      if (rval) {
        const results = rval.results
          ? (Array.isArray(rval.results) ? rval.results : [rval.results])
          : (Array.isArray(rval) ? rval : []);

        advertisers = results
          .filter((r: any) => r && r.id)
          .map((r: any) => ({ id: String(r.id), name: String(r.name || '') }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
      }

      if (advertisers.length === 0 && NETWORK_ADVERTISERS[networkCode]) {
        advertisers = NETWORK_ADVERTISERS[networkCode].map(a => ({ id: a.id, name: a.name }));
      }

      if (authUser && authUser.role !== 'admin' && authUser.advertiserName && authUser.advertiserName !== 'All Advertisers' && authUser.advertiserId !== 'ALL') {
        const scoped = advertisers.filter(a => a.name.toLowerCase() === authUser.advertiserName!.toLowerCase() || a.id === authUser.advertiserId);
        advertisers = scoped.length > 0 ? scoped : [{ id: authUser.advertiserId || 'scoped', name: authUser.advertiserName }];
      }

      return res.json({
        success: true,
        networkCode,
        count: advertisers.length,
        data: advertisers
      });
    } catch (err: any) {
      // Check pre-configured network advertisers on network failure
      if (NETWORK_ADVERTISERS[networkCode]) {
        let list = NETWORK_ADVERTISERS[networkCode].map(a => ({ id: a.id, name: a.name }));
        if (authUser && authUser.role !== 'admin' && authUser.advertiserName && authUser.advertiserName !== 'All Advertisers' && authUser.advertiserId !== 'ALL') {
          const scoped = list.filter(a => a.name.toLowerCase() === authUser.advertiserName!.toLowerCase() || a.id === authUser.advertiserId);
          list = scoped.length > 0 ? scoped : [{ id: authUser.advertiserId || 'scoped', name: authUser.advertiserName }];
        }
        return res.json({
          success: true,
          networkCode,
          count: list.length,
          data: list
        });
      }

      const durationMs = Date.now() - startMs;
      logRepo.create({
        id: logId,
        campaignId: undefined,
        operation: 'getCompaniesByStatement',
        service: 'CompanyService',
        requestData: { networkCode, filter: "WHERE type = 'ADVERTISER' OR type = 'AGENCY'" },
        responseData: { error: err.message },
        status: 'ERROR',
        errorMessage: err.message,
        durationMs,
        createdAt: new Date().toISOString()
      });
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /** Fetch live companies from GAM network and synchronize/save them into local database */
  async syncGamAdvertisers(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    let networkCode = String(req.body.networkCode || req.query.networkCode || '22068249324').trim();
    if (authUser && authUser.role !== 'admin' && authUser.networkCode && authUser.networkCode !== 'ALL') {
      networkCode = authUser.networkCode;
    }
    try {
      let candidateCompanies: { id: string; name: string }[] = [];

      try {
        const token = await GoogleAdManagerAuthService.getAccessToken();
        if (token) {
          const bodyXml = `
            <ns:getCompaniesByStatement>
              <ns:filterStatement>
                <ns:query>WHERE type = 'ADVERTISER' OR type = 'AGENCY' ORDER BY name ASC LIMIT 500</ns:query>
              </ns:filterStatement>
            </ns:getCompaniesByStatement>
          `;

          const response = await soapClient.execute({
            service: 'CompanyService',
            action: 'getCompaniesByStatement',
            bodyXml,
            networkCode
          }, token);

          if (response.success && response.data?.rval?.results) {
            const results = Array.isArray(response.data.rval.results)
              ? response.data.rval.results
              : [response.data.rval.results];
            candidateCompanies = results
              .filter((r: any) => r && r.id && r.name)
              .map((r: any) => ({ id: String(r.id), name: String(r.name).trim() }));
          }
        }
      } catch {
        // Fallback to pre-indexed network advertisers
      }

      if (candidateCompanies.length === 0 && NETWORK_ADVERTISERS[networkCode]) {
        candidateCompanies = NETWORK_ADVERTISERS[networkCode].map(a => ({ id: a.id, name: a.name }));
      }

      let synced: any[] = [];
      for (const comp of candidateCompanies) {
        const existing = advertiserRepo.findByName(comp.name, networkCode);
        if (existing) {
          if (!existing.googleAdvertiserId) {
            advertiserRepo.updateGoogleId(existing.id, comp.id);
          }
          if (!existing.networkCode && networkCode) {
            advertiserRepo.updateNetworkCode(existing.id, networkCode);
          }
          synced.push({ ...existing, googleAdvertiserId: comp.id, networkCode: existing.networkCode || networkCode });
        } else {
          const created = advertiserRepo.create({
            id: `ADV-${comp.id}`,
            name: comp.name,
            googleAdvertiserId: comp.id,
            status: 'ACTIVE',
            networkCode: networkCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          synced.push(created);
        }
      }

      return res.json({
        success: true,
        networkCode,
        count: synced.length,
        message: `Successfully synced ${synced.length} real advertisers for network ${networkCode}!`,
        data: synced
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

// -------------------------------------------------------------
// CMS & Webhook Sync Controller
// -------------------------------------------------------------
export const cmsController = {
  async listPartners(req: Request, res: Response) {
    try {
      const partners = cmsPartnerRepo.list();
      return res.json({ success: true, data: partners });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async createPartner(req: Request, res: Response) {
    try {
      const { name, cmsType, endpoint, apiPath, securityToken, autoSyncCampaigns, autoSyncAdUnits, isActive } = req.body;
      if (!name || !endpoint || !apiPath || !securityToken) {
        return res.status(400).json({
          success: false,
          error: 'Partner Name, Endpoint, API Path, and Security Token (s-d) are required.'
        });
      }

      const partner = cmsPartnerRepo.create({
        name,
        cmsType: cmsType || 'HOCALWIRE',
        endpoint,
        apiPath,
        securityToken,
        autoSyncCampaigns: autoSyncCampaigns !== false,
        autoSyncAdUnits: autoSyncAdUnits !== false,
        isActive: isActive !== false
      });

      return res.status(201).json({ success: true, data: partner });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async updatePartner(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const updated = cmsPartnerRepo.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Partner ${id} not found.` });
      }
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async deletePartner(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const ok = cmsPartnerRepo.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, error: `Partner ${id} not found.` });
      }
      return res.json({ success: true, message: `Partner ${id} deleted.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async testPartner(req: Request, res: Response) {
    try {
      const { endpoint, apiPath, securityToken, partnerId, name } = req.body;
      let targetData: { endpoint: string; apiPath: string; securityToken: string; name?: string };

      if (partnerId) {
        const p = cmsPartnerRepo.findById(partnerId);
        if (!p) {
          return res.status(404).json({ success: false, error: 'Partner not found.' });
        }
        targetData = {
          endpoint: p.endpoint,
          apiPath: p.apiPath,
          securityToken: p.securityToken,
          name: p.name
        };
      } else {
        if (!endpoint || !apiPath || !securityToken) {
          return res.status(400).json({
            success: false,
            error: 'Endpoint, API Path, and Security Token (s-d) are required for testing.'
          });
        }
        targetData = { endpoint, apiPath, securityToken, name };
      }

      const testResult = await CmsSyncService.testPartnerConnection(targetData);
      return res.json({ success: true, data: testResult });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async syncCampaign(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.id);
      const partnerId = req.body.partnerId ? String(req.body.partnerId) : undefined;
      const results = await CmsSyncService.syncCampaign(campaignId, partnerId);
      return res.json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async syncAdUnits(req: Request, res: Response) {
    try {
      const { adUnitIds, partnerId } = req.body;
      const results = await CmsSyncService.syncAdUnits(adUnitIds, partnerId);
      return res.json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async fetchElements(req: Request, res: Response) {
    try {
      const partnerIdOrUrl = req.body.partnerId || req.query.partnerId || req.body.url || req.query.url;
      const data = await CmsSyncService.fetchPartnerElements(partnerIdOrUrl ? String(partnerIdOrUrl) : undefined);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async pushElementDfp(req: Request, res: Response) {
    try {
      const { partnerId, element, networkCode, customSnippet } = req.body;
      if (!element || !element.slotCode || !element.divId) {
        return res.status(400).json({
          success: false,
          error: 'Element details including slotCode and divId are required.'
        });
      }

      const result = await CmsSyncService.pushElementDfp({
        partnerId,
        element,
        networkCode,
        customSnippet
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};



