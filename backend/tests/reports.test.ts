import { reportsController } from '../src/controllers/reportsController';
import { initDatabase } from '../src/database/db';

describe('GAM Performance Reports Controller', () => {
  beforeAll(() => {
    initDatabase();
  });

  test('filters strictly by GAM network code without leaking across networks', async () => {
    // 1. The Federal (22665183713)
    let federalRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22665183713' }
    } as any, {
      json(d: any) { federalRes = d; return this; },
      status() { return this; }
    } as any);

    expect(federalRes.success).toBe(true);
    expect(federalRes.data.length).toBeGreaterThan(0);
    expect(federalRes.data.every((r: any) => r.networkCode === '22665183713')).toBe(true);
    expect(federalRes.data.some((r: any) => r.advertiserName.includes('The Federal'))).toBe(true);

    // 2. News Track (22212039110)
    let ntRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22212039110' }
    } as any, {
      json(d: any) { ntRes = d; return this; },
      status() { return this; }
    } as any);

    expect(ntRes.success).toBe(true);
    expect(ntRes.data.length).toBeGreaterThan(0);
    expect(ntRes.data.every((r: any) => r.networkCode === '22212039110')).toBe(true);

    // 3. Blinkcorp (22068249324)
    let blinkRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22068249324' }
    } as any, {
      json(d: any) { blinkRes = d; return this; },
      status() { return this; }
    } as any);

    expect(blinkRes.success).toBe(true);
    expect(blinkRes.data.length).toBeGreaterThan(0);
    expect(blinkRes.data.every((r: any) => r.networkCode === '22068249324')).toBe(true);
  });

  test('filters by ad placement size accurately', async () => {
    let sizeRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22212039110', adSlot: '300x250' }
    } as any, {
      json(d: any) { sizeRes = d; return this; },
      status() { return this; }
    } as any);

    expect(sizeRes.success).toBe(true);
    expect(sizeRes.data.length).toBe(2);
    expect(sizeRes.data.every((r: any) => r.adSlot.includes('300x250'))).toBe(true);
  });

  test('returns daily trend series, device split, and slot breakdown', async () => {
    let reportRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22665183713' }
    } as any, {
      json(d: any) { reportRes = d; return this; },
      status() { return this; }
    } as any);

    expect(reportRes.dailyTrends).toBeDefined();
    expect(reportRes.dailyTrends.length).toBe(7);
    expect(reportRes.deviceBreakdown).toBeDefined();
    expect(reportRes.deviceBreakdown.mobile.percentage).toBe(68);
    expect(reportRes.slotBreakdown).toBeDefined();
    expect(reportRes.slotBreakdown.length).toBeGreaterThan(0);
  });

  test('supports date range filtering scaling', async () => {
    let todayRes: any = null;
    await reportsController.getCampaignReport({
      params: {},
      query: { networkCode: '22665183713', dateRange: 'today' }
    } as any, {
      json(d: any) { todayRes = d; return this; },
      status() { return this; }
    } as any);

    expect(todayRes.summary.dateRangeLabel).toBe('Today');
    expect(todayRes.summary.totalDeliveredImpressions).toBeLessThan(2600000);
  });
});
