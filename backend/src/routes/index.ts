import { Router } from 'express';
import {
  campaignController,
  adUnitController,
  advertiserController,
  gptController,
  logController,
  settingsController,
  authController,
  gamLiveController,
  cmsController,
  clientController
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
router.put('/auth/users/:id', authController.updateUser);
router.post('/auth/users/:id/reset-password', authController.resetUserPassword);
router.post('/auth/users/:id/toggle-status', authController.toggleUserStatus);
router.delete('/auth/users/:id', authController.deleteUser);
router.post('/auth/change-password', authController.changePassword);
router.get('/auth/users/audit-logs', authController.listAuditLogs);

// GAM Clients & Network Code Onboarding Routes (Admin Only)
router.get('/admin/clients', clientController.list);
router.get('/admin/clients/:id', clientController.getById);
router.post('/admin/clients', clientController.create);
router.put('/admin/clients/:id', clientController.update);
router.post('/admin/clients/:id/pull-info', clientController.pullInfo);
router.post('/admin/clients/test-network', clientController.testNetwork);
router.delete('/admin/clients/:id', clientController.delete);

// Reports & Performance Routes
router.get('/reports', reportsController.getCampaignReport);
router.get('/reports/:campaignId', reportsController.getCampaignReport);

// Inventory Forecast & Availability Routes
router.post('/forecast/availability', forecastController.checkAvailability);

// CMS & Partner Webhook Sync Routes
router.get('/cms/partners', cmsController.listPartners);
router.post('/cms/partners', cmsController.createPartner);
router.put('/cms/partners/:id', cmsController.updatePartner);
router.delete('/cms/partners/:id', cmsController.deletePartner);
router.post('/cms/test', cmsController.testPartner);
router.post('/cms/sync/campaign/:id', cmsController.syncCampaign);
router.post('/cms/sync/ad-units', cmsController.syncAdUnits);
router.post('/cms/fetch-elements', cmsController.fetchElements);
router.post('/cms/push-element-dfp', cmsController.pushElementDfp);

export default router;

