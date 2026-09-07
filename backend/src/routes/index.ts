import { Router } from 'express';
import {
  campaignController,
  adUnitController,
  advertiserController,
  gptController,
  logController,
  settingsController,
  authController,
  gamLiveController
} from '../controllers';
import { testConnectionController } from '../controllers/testConnectionController';
import { reportsController, forecastController } from '../controllers/reportsController';

const router = Router();

// Campaign Routes
router.get('/campaigns', campaignController.list);
router.post('/campaigns', campaignController.create);
router.get('/campaigns/:id', campaignController.getById);
router.post('/campaigns/:id/run', campaignController.run);
router.post('/campaigns/:id/retry', campaignController.retry);
router.post('/campaigns/:id/pause', campaignController.pause);
router.post('/campaigns/:id/resume', campaignController.resume);
router.post('/campaigns/:id/creatives/bulk-update', campaignController.bulkUpdateCreativeBanners);
router.delete('/campaigns/:id', campaignController.delete);

// Ad Unit Routes
router.get('/ad-units', adUnitController.list);
router.post('/ad-units', adUnitController.create);
router.delete('/ad-units/:id', adUnitController.delete);

// Advertiser Routes
router.get('/advertisers', advertiserController.list);
router.post('/advertisers', advertiserController.create);
router.delete('/advertisers/:id', advertiserController.delete);

// Live GAM Data Routes
router.get('/gam/networks', gamLiveController.getNetworks);
router.get('/gam/advertisers', gamLiveController.getGamAdvertisers);
router.post('/gam/advertisers/sync', gamLiveController.syncGamAdvertisers);

// GPT Generator Routes
router.post('/gpt/generate', gptController.generate);
router.get('/gpt/:campaignId', gptController.getByCampaign);

// Log Routes
router.get('/logs', logController.list);
router.delete('/logs', logController.clearAll);
router.get('/logs/:campaignId', logController.getByCampaign);

// Settings Routes
router.get('/settings', settingsController.get);
router.put('/settings', settingsController.update);
router.post('/settings/test-connection', testConnectionController);
router.post('/settings/test-webhook', settingsController.testWebhook);

// User Authentication & Profile Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.me);
router.get('/auth/users', authController.listUsers);

// Reports & Performance Routes
router.get('/reports', reportsController.getCampaignReport);
router.get('/reports/:campaignId', reportsController.getCampaignReport);

// Inventory Forecast & Availability Routes
router.post('/forecast/availability', forecastController.checkAvailability);

export default router;

