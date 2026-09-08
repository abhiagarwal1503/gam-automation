import { initDatabase, db } from '../src/database/db';
import { userRepo, campaignRepo } from '../src/repositories';

describe('Partner Scoping & Demo Admin System', () => {
  beforeAll(() => {
    initDatabase();
  });

  test('seeds global admin and partner-scoped demo accounts', () => {
    const admin = userRepo.findByEmail('admin@gam.io');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');
    expect(admin?.networkCode).toBe('ALL');

    const blink = userRepo.findByEmail('blink@gam.io');
    expect(blink).toBeDefined();
    expect(blink?.networkCode).toBe('22068249324');
    expect(blink?.partnerName).toContain('Blinkcorp');

    const federal = userRepo.findByEmail('thefederal@gam.io');
    expect(federal).toBeDefined();
    expect(federal?.networkCode).toBe('22665183713');
    expect(federal?.partnerName).toBe('The Federal');
  });

  test('campaignRepo filters campaigns strictly by networkCode when provided', () => {
    // Create two test campaigns for distinct networks
    const campBlink = campaignRepo.create({
      id: 'cmp_test_blink_01',
      advertiserName: 'Blink Advert 1',
      bannerUrl: 'https://example.com/banner.png',
      targetUrl: 'https://blink.example.com',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [{ width: 300, height: 250 }],
      position: 'homepage',
      networkCode: '22068249324',
      status: 'READY',
      currentStep: 'COMPLETED',
      isDryRun: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const campFederal = campaignRepo.create({
      id: 'cmp_test_federal_01',
      advertiserName: 'Federal Advert 1',
      bannerUrl: 'https://example.com/banner.png',
      targetUrl: 'https://federal.example.com',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [{ width: 728, height: 90 }],
      position: 'top',
      networkCode: '22665183713',
      status: 'READY',
      currentStep: 'COMPLETED',
      isDryRun: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 1. Scoped query for Blink
    const blinkList = campaignRepo.list('22068249324');
    const hasBlink = blinkList.some(c => c.id === campBlink.id);
    const hasFederalInBlink = blinkList.some(c => c.id === campFederal.id);
    expect(hasBlink).toBe(true);
    expect(hasFederalInBlink).toBe(false);

    // 2. Scoped query for Federal
    const federalList = campaignRepo.list('22665183713');
    const hasFederal = federalList.some(c => c.id === campFederal.id);
    const hasBlinkInFederal = federalList.some(c => c.id === campBlink.id);
    expect(hasFederal).toBe(true);
    expect(hasBlinkInFederal).toBe(false);

    // 3. Admin query (ALL or undefined) returns both
    const allList = campaignRepo.list('ALL');
    expect(allList.some(c => c.id === campBlink.id)).toBe(true);
    expect(allList.some(c => c.id === campFederal.id)).toBe(true);

    // Clean up test campaigns
    campaignRepo.delete(campBlink.id);
    campaignRepo.delete(campFederal.id);
  });

  test('userRepo supports provisioning partner-mapped users and deleting them', () => {
    const testUser = userRepo.create({
      name: 'News Track Trafficker',
      email: 'trafficker@newstrack.test',
      password: 'SecurePassword123',
      role: 'trafficker',
      networkCode: '22212039110',
      partnerName: 'News Track'
    });

    expect(testUser.id).toBeDefined();
    expect(testUser.networkCode).toBe('22212039110');
    expect(testUser.partnerName).toBe('News Track');

    const fetched = userRepo.findById(testUser.id);
    expect(fetched?.email).toBe('trafficker@newstrack.test');
    expect(fetched?.networkCode).toBe('22212039110');

    // Delete
    const deleted = userRepo.delete(testUser.id);
    expect(deleted).toBe(true);
    expect(userRepo.findById(testUser.id)).toBeNull();
  });

  test('adUnitRepo scopes inventory by networkCode', () => {
    const blinkUnits = db.prepare('SELECT * FROM ad_units WHERE network_code = ?').all('22068249324');
    const federalUnits = db.prepare('SELECT * FROM ad_units WHERE network_code = ?').all('22665183713');

    expect(blinkUnits.length).toBeGreaterThan(0);
    expect(federalUnits.length).toBeGreaterThan(0);

    // Verify list scoping
    const scopedBlink = (require('../src/repositories').adUnitRepo).list('22068249324');
    const scopedFederal = (require('../src/repositories').adUnitRepo).list('22665183713');

    expect(scopedBlink.every((u: any) => !u.networkCode || u.networkCode === '22068249324')).toBe(true);
    expect(scopedFederal.every((u: any) => !u.networkCode || u.networkCode === '22665183713')).toBe(true);
  });

  test('logController, reportsController, and forecastController reject non-admin users with 403', async () => {
    const { logController } = require('../src/controllers');
    const { reportsController, forecastController } = require('../src/controllers/reportsController');

    // Partner user token
    const partnerToken = Buffer.from(JSON.stringify({ id: 'usr_partner_blink_001', email: 'blink@gam.io', exp: Date.now() + 100000 })).toString('base64');
    const partnerReq: any = {
      headers: { authorization: `Bearer ${partnerToken}` },
      query: {},
      params: {},
      body: { startDate: '2026-09-01', endDate: '2026-09-30' }
    };

    let logStatus = 0, logJson: any = null;
    const partnerLogRes: any = {
      status(code: number) { logStatus = code; return this; },
      json(data: any) { logJson = data; return this; }
    };

    await logController.list(partnerReq, partnerLogRes);
    expect(logStatus).toBe(403);
    expect(logJson?.error).toContain('Access Denied');

    let reportStatus = 0, reportJson: any = null;
    const partnerReportRes: any = {
      status(code: number) { reportStatus = code; return this; },
      json(data: any) { reportJson = data; return this; }
    };

    await reportsController.getCampaignReport(partnerReq, partnerReportRes);
    expect(reportStatus).toBe(403);
    expect(reportJson?.error).toContain('Access Denied');

    let forecastStatus = 0, forecastJson: any = null;
    const partnerForecastRes: any = {
      status(code: number) { forecastStatus = code; return this; },
      json(data: any) { forecastJson = data; return this; }
    };

    await forecastController.checkAvailability(partnerReq, partnerForecastRes);
    expect(forecastStatus).toBe(403);
    expect(forecastJson?.error).toContain('Access Denied');

    // Test gptController.generate rejects non-admin users with 403
    const { gptController } = require('../src/controllers');
    const gptReq: any = {
      headers: { authorization: `Bearer ${partnerToken}` },
      body: {
        networkCode: '22068249324',
        adUnitCode: 'test_ad_unit',
        size: { width: 300, height: 250 }
      }
    };
    let gptStatus = 0, gptJson: any = null;
    const gptRes: any = {
      status(code: number) { gptStatus = code; return this; },
      json(data: any) { gptJson = data; return this; }
    };
    await gptController.generate(gptReq, gptRes);
    expect(gptStatus).toBe(403);
    expect(gptJson?.error).toContain('Access Denied');
  });

  test('advertiserRepo and advertiserController scope advertisers strictly by partner network', async () => {
    const { advertiserRepo } = require('../src/repositories');
    const { advertiserController } = require('../src/controllers');

    // 1. Check seeded advertisers for Blink and Federal
    const blinkAdvertisers = advertiserRepo.list('22068249324');
    const federalAdvertisers = advertiserRepo.list('22665183713');

    expect(blinkAdvertisers.length).toBeGreaterThan(0);
    expect(federalAdvertisers.length).toBeGreaterThan(0);

    expect(blinkAdvertisers.some((a: any) => a.name === 'Assam Tribune' || a.name === 'TechStar Brand')).toBe(true);
    expect(federalAdvertisers.some((a: any) => a.name === 'The Federal Sponsor' || a.name === 'Federal National Brands')).toBe(true);

    // Cross-check: Federal should not see Blink-specific advertisers
    expect(federalAdvertisers.some((a: any) => a.name === 'Assam Tribune')).toBe(false);
    expect(blinkAdvertisers.some((a: any) => a.name === 'The Federal Sponsor')).toBe(false);

    // 2. Test advertiserController.list with partner token
    const partnerToken = Buffer.from(JSON.stringify({ id: 'usr_partner_federal_001', email: 'thefederal@gam.io', exp: Date.now() + 100000 })).toString('base64');
    const partnerReq: any = {
      headers: { authorization: `Bearer ${partnerToken}` },
      query: {},
      params: {},
      body: {}
    };

    let listJson: any = null;
    const partnerRes: any = {
      json(data: any) { listJson = data; return this; },
      status() { return this; }
    };

    await advertiserController.list(partnerReq, partnerRes);
    expect(listJson.success).toBe(true);
    expect(listJson.data.length).toBeGreaterThan(0);
    expect(listJson.data.every((a: any) => !a.networkCode || a.networkCode === '22665183713')).toBe(true);
    expect(listJson.data.some((a: any) => a.name === 'The Federal Sponsor')).toBe(true);

    // 3. Test advertiserController.create with partner token auto-assigns networkCode
    const createReq: any = {
      headers: { authorization: `Bearer ${partnerToken}` },
      query: {},
      params: {},
      body: { name: `Test Federal Partner Brand ${Date.now()}` }
    };

    let createdJson: any = null;
    let createStatus = 0;
    const createRes: any = {
      status(code: number) { createStatus = code; return this; },
      json(data: any) { createdJson = data; return this; }
    };

    await advertiserController.create(createReq, createRes);
    expect(createStatus).toBe(201);
    expect(createdJson.success).toBe(true);
    expect(createdJson.data.networkCode).toBe('22665183713');

    // Clean up created advertiser
    advertiserRepo.delete(createdJson.data.id);
  });

  test('supports assigning advertiser to user and scopes campaignController and advertiserController', async () => {
    const { userRepo, campaignRepo, advertiserRepo } = require('../src/repositories');
    const { campaignController, advertiserController } = require('../src/controllers');

    // 1. Create a user with default advertiser ('ALL', 'All Advertisers')
    const allAdvUser = userRepo.create({
      name: 'Federal General User',
      email: `federal_general_${Date.now()}@gam.io`,
      password: 'Password123!',
      role: 'partner',
      networkCode: '22665183713',
      partnerName: 'The Federal'
    });
    expect(allAdvUser.advertiserId).toBe('ALL');
    expect(allAdvUser.advertiserName).toBe('All Advertisers');

    // 2. Create a user assigned to a specific advertiser
    const scopedUser = userRepo.create({
      name: 'Federal Sponsor User',
      email: `federal_sponsor_${Date.now()}@gam.io`,
      password: 'Password123!',
      role: 'partner',
      networkCode: '22665183713',
      partnerName: 'The Federal',
      advertiserId: '6156180871',
      advertiserName: 'The Federal Sponsor'
    });
    expect(scopedUser.advertiserId).toBe('6156180871');
    expect(scopedUser.advertiserName).toBe('The Federal Sponsor');

    // 3. Create two campaigns under the Federal network: one for 'The Federal Sponsor' and one for 'Federal National Brands'
    const camp1 = campaignRepo.create({
      id: `cmp_fed_sponsor_${Date.now()}`,
      advertiserName: 'The Federal Sponsor',
      bannerUrl: 'https://example.com/b1.png',
      targetUrl: 'https://sponsor.thefederal.com',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [{ width: 300, height: 250 }],
      position: 'homepage',
      networkCode: '22665183713',
      status: 'READY',
      currentStep: 'COMPLETED',
      isDryRun: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const camp2 = campaignRepo.create({
      id: `cmp_fed_national_${Date.now()}`,
      advertiserName: 'Federal National Brands',
      bannerUrl: 'https://example.com/b2.png',
      targetUrl: 'https://national.thefederal.com',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [{ width: 728, height: 90 }],
      position: 'top',
      networkCode: '22665183713',
      status: 'READY',
      currentStep: 'COMPLETED',
      isDryRun: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 4. Test campaignController.list with scoped user token
    const scopedToken = Buffer.from(JSON.stringify({ id: scopedUser.id, email: scopedUser.email, exp: Date.now() + 100000 })).toString('base64');
    const scopedReq: any = {
      headers: { authorization: `Bearer ${scopedToken}` },
      query: {},
      params: {},
      body: {}
    };
    let scopedCampJson: any = null;
    const scopedCampRes: any = {
      json(data: any) { scopedCampJson = data; return this; },
      status() { return this; }
    };

    await campaignController.list(scopedReq, scopedCampRes);
    expect(scopedCampJson.success).toBe(true);
    expect(scopedCampJson.data.some((c: any) => c.id === camp1.id)).toBe(true);
    expect(scopedCampJson.data.some((c: any) => c.id === camp2.id)).toBe(false);

    // 5. Test campaignController.list with all-advertisers user token
    const allToken = Buffer.from(JSON.stringify({ id: allAdvUser.id, email: allAdvUser.email, exp: Date.now() + 100000 })).toString('base64');
    const allReq: any = {
      headers: { authorization: `Bearer ${allToken}` },
      query: {},
      params: {},
      body: {}
    };
    let allCampJson: any = null;
    const allCampRes: any = {
      json(data: any) { allCampJson = data; return this; },
      status() { return this; }
    };

    await campaignController.list(allReq, allCampRes);
    expect(allCampJson.success).toBe(true);
    expect(allCampJson.data.some((c: any) => c.id === camp1.id)).toBe(true);
    expect(allCampJson.data.some((c: any) => c.id === camp2.id)).toBe(true);

    // 6. Test advertiserController.list with scoped user token
    let scopedAdvJson: any = null;
    const scopedAdvRes: any = {
      json(data: any) { scopedAdvJson = data; return this; },
      status() { return this; }
    };
    await advertiserController.list(scopedReq, scopedAdvRes);
    expect(scopedAdvJson.success).toBe(true);
    expect(scopedAdvJson.data.every((a: any) => a.name === 'The Federal Sponsor' || a.id === '6156180871')).toBe(true);

    // Cleanup
    campaignRepo.delete(camp1.id);
    campaignRepo.delete(camp2.id);
    userRepo.delete(allAdvUser.id);
    userRepo.delete(scopedUser.id);
  });
});
