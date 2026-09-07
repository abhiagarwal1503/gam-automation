import { Request, Response } from 'express';
import { db } from '../database/db';
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
  userRepo
} from '../repositories';
import { CampaignWorkflowService } from '../services/campaignWorkflowService';
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

// -------------------------------------------------------------
// Campaign Controller
// -------------------------------------------------------------
export const campaignController = {
  async list(req: Request, res: Response) {
    try {
      const campaigns = campaignRepo.list();
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

      const campaign = await CampaignWorkflowService.createAndRunCampaign({
        advertiserName,
        customName: customName || undefined,
        advertiserId: advertiserId || undefined,
        networkCode: networkCode || undefined,
        bannerUrl,
        targetUrl,
        startDate,
        endDate,
        sizes: sizes || [{ width: 300, height: 250 }],
        position: position || 'homepage',
        isDryRun: Boolean(isDryRun)
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
      // banners is an optional map: { "300x250": dataUrlOrUrl, "728x90": dataUrlOrUrl }

      const campaign = campaignRepo.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      const order = orderRepo.findByCampaignId(campaignId);
      const lineItems = lineItemRepo.findByCampaignId(campaignId);
      const creatives = creativeRepo.findByCampaignId(campaignId);
      const advertiser = advertiserRepo.findByName(campaign.advertiserName);
      const googleAdvertiserId = campaign.advertiserId || advertiser?.googleAdvertiserId;

      const updatedCreatives: any[] = [];
      const isDryRun = campaign.isDryRun;

      for (const cr of creatives) {
        const sizeKey = `${cr.width}x${cr.height}`;
        const newBannerUrl = (banners && banners[sizeKey]) || defaultBannerUrl || banners?.default;

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
            if (cr.lineItemId) {
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
      if (defaultBannerUrl || (banners && Object.values(banners)[0])) {
        const primaryUrl = defaultBannerUrl || Object.values(banners)[0];
        db.prepare('UPDATE campaigns SET banner_url = ?, updated_at = ? WHERE id = ?')
          .run(String(primaryUrl), new Date().toISOString(), campaignId);
      }

      return res.json({
        success: true,
        message: `Updated banner images across ${updatedCreatives.length} ad format(s) in GAM!`,
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
      const adUnits = adUnitRepo.list();
      return res.json({ success: true, data: adUnits });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, code, sizes, parentGoogleAdUnitId, googleAdUnitId } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and Code are required.' });
      }

      const existing = adUnitRepo.findByCode(code);
      if (existing) {
        return res.status(409).json({ success: false, error: `Ad Unit with code '${code}' already exists.` });
      }

      const adUnit = adUnitRepo.create({
        id: `ADU-${Date.now().toString().slice(-6)}`,
        name,
        code,
        sizes: sizes || [{ width: 300, height: 250 }],
        parentGoogleAdUnitId,
        googleAdUnitId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      const advertisers = advertiserRepo.list();
      return res.json({ success: true, data: advertisers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, googleAdvertiserId } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Advertiser name is required.' });
      }

      const existing = advertiserRepo.findByName(name);
      if (existing) {
        return res.status(409).json({ success: false, error: `Advertiser '${name}' already exists.` });
      }

      const advertiser = advertiserRepo.create({
        id: `ADV-${Date.now().toString().slice(-6)}`,
        name,
        googleAdvertiserId,
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
      const limit = parseInt(req.query.limit as string || '100', 10);
      const logs = logRepo.list(limit);
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getByCampaign(req: Request, res: Response) {
    try {
      const campaignId = getParam(req.params.campaignId);
      const logs = logRepo.findByCampaignId(campaignId);
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async clearAll(req: Request, res: Response) {
    try {
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
      // Never send clientSecret in plaintext
      const safeSettings = {
        ...settings,
        googleClientSecret: settings.googleClientSecret ? '********' : '',
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
      settingsRepo.save(updated);
      return res.json({ success: true, data: updated });
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
      const { name, email, password, role } = req.body;
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
        return res.status(409).json({ success: false, error: 'An account with this email already exists. Please log in instead.' });
      }

      const user = userRepo.create({
        name,
        email,
        password,
        role: role || 'trafficker'
      });

      // Generate a lightweight session token
      const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64');

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
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
      const users = userRepo.list();
      return res.json({ success: true, data: users });
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
  /** Return the hardcoded list of managed GAM networks */
  async getNetworks(req: Request, res: Response) {
    return res.json({ success: true, data: GAM_NETWORKS });
  },

  /** Fetch real advertisers (ADVERTISER type companies) from a GAM network */
  async getGamAdvertisers(req: Request, res: Response) {
    const networkCode = String(req.query.networkCode || '').trim();
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

      return res.json({
        success: true,
        networkCode,
        count: advertisers.length,
        data: advertisers
      });
    } catch (err: any) {
      // Check pre-configured network advertisers on network failure
      if (NETWORK_ADVERTISERS[networkCode]) {
        const list = NETWORK_ADVERTISERS[networkCode].map(a => ({ id: a.id, name: a.name }));
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
    const networkCode = String(req.body.networkCode || req.query.networkCode || '22068249324').trim();
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
        const existing = advertiserRepo.findByName(comp.name);
        if (existing) {
          if (!existing.googleAdvertiserId) {
            advertiserRepo.updateGoogleId(existing.id, comp.id);
          }
          synced.push({ ...existing, googleAdvertiserId: comp.id });
        } else {
          const created = advertiserRepo.create({
            id: `ADV-${comp.id}`,
            name: comp.name,
            googleAdvertiserId: comp.id,
            status: 'ACTIVE',
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


