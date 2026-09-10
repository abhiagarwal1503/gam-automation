import { CampaignWorkflowService } from '../src/services/campaignWorkflowService';
import { campaignRepo, orderRepo, lineItemRepo, creativeRepo, gptTagRepo } from '../src/repositories';
import { initDatabase } from '../src/database/db';

describe('Campaign Workflow Saga & Idempotency', () => {
  const testCampaignIds: string[] = [];

  beforeAll(() => {
    initDatabase();
  });

  afterAll(() => {
    for (const cid of testCampaignIds) {
      campaignRepo.delete(cid);
    }
  });

  test('executes end-to-end campaign creation in dry-run mode', async () => {
    const campaignId = `CMP-TEST-${Date.now()}`;
    testCampaignIds.push(campaignId);
    const now = new Date().toISOString();

    const campaign = campaignRepo.create({
      id: campaignId,
      advertiserName: 'Test Corporation',
      bannerUrl: 'https://example.com/banner.jpg',
      targetUrl: 'https://example.com/promo',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [{ width: 300, height: 250 }],
      position: 'homepage',
      status: 'DRAFT',
      currentStep: 'INITIALIZED',
      isDryRun: true,
      createdAt: now,
      updatedAt: now
    });

    // Execute workflow synchronously
    const result = await CampaignWorkflowService.executeWorkflow(campaign.id);
    if (!result.success) {
      console.error('Workflow failed with error:', result.error, result.googleError);
    }
    expect(result.success).toBe(true);
    expect(result.step).toBe('COMPLETED');

    const updated = campaignRepo.findById(campaign.id);
    expect(updated?.status).toBe('READY');

    // Verify entities created
    const order = orderRepo.findByCampaignId(campaign.id);
    expect(order).toBeDefined();
    expect(order?.name).toContain('test_corporation');
    expect(order?.googleOrderId).toBeDefined();

    const lineItems = lineItemRepo.findByCampaignId(campaign.id);
    expect(lineItems.length).toBe(1);
    expect(lineItems[0].googleLineItemId).toBeDefined();

    const creatives = creativeRepo.findByCampaignId(campaign.id);
    expect(creatives.length).toBe(1);
    expect(creatives[0].googleCreativeId).toBeDefined();

    const gptTags = gptTagRepo.findByCampaignId(campaign.id);
    expect(gptTags.length).toBe(1);
    expect(gptTags[0].headCode).toContain('googletag.defineSlot');
  });

  test('idempotency: running workflow multiple times reuses existing entities', async () => {
    const campaignId = `CMP-IDEM-${Date.now()}`;
    testCampaignIds.push(campaignId);
    const now = new Date().toISOString();

    const campaign = campaignRepo.create({
      id: campaignId,
      advertiserName: 'Idempotent Brand',
      bannerUrl: 'https://example.com/banner.jpg',
      targetUrl: 'https://example.com/offer',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
      sizes: [{ width: 300, height: 250 }],
      position: 'homepage',
      status: 'DRAFT',
      currentStep: 'INITIALIZED',
      isDryRun: true,
      createdAt: now,
      updatedAt: now
    });

    const result1 = await CampaignWorkflowService.executeWorkflow(campaign.id);
    expect(result1.success).toBe(true);

    const initialOrder = orderRepo.findByCampaignId(campaign.id);
    const initialLineItems = lineItemRepo.findByCampaignId(campaign.id);

    // Run again
    const result2 = await CampaignWorkflowService.executeWorkflow(campaign.id);
    expect(result2.success).toBe(true);

    const secondOrder = orderRepo.findByCampaignId(campaign.id);
    const secondLineItems = lineItemRepo.findByCampaignId(campaign.id);

    // Google IDs should remain identical, no duplicates
    expect(secondOrder?.googleOrderId).toBe(initialOrder?.googleOrderId);
    expect(secondLineItems.length).toBe(initialLineItems.length);
    expect(secondLineItems[0].googleLineItemId).toBe(initialLineItems[0].googleLineItemId);
  });

  test('executes multi-size batch campaign with Sponsorship Priority 4 and size-specific assetsMap', async () => {
    const campaignId = `CMP-MULTI-${Date.now()}`;
    testCampaignIds.push(campaignId);
    const now = new Date().toISOString();

    const campaign = campaignRepo.create({
      id: campaignId,
      advertiserName: 'MultiSize Sponsor Co',
      bannerUrl: 'https://example.com/master-1200x628.jpg',
      targetUrl: 'https://example.com/multi-promo',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      sizes: [
        { width: 300, height: 250 },
        { width: 728, height: 90 },
        { width: 320, height: 50 }
      ],
      lineItemType: 'SPONSORSHIP',
      creativeType: 'IMAGE',
      assetsMap: {
        '300x250': 'data:image/jpeg;base64,mock300x250data',
        '728x90': 'data:image/jpeg;base64,mock728x90data',
        '320x50': 'data:image/jpeg;base64,mock320x50data'
      },
      position: 'homepage',
      status: 'DRAFT',
      currentStep: 'INITIALIZED',
      isDryRun: true,
      createdAt: now,
      updatedAt: now
    });

    const result = await CampaignWorkflowService.executeWorkflow(campaign.id);
    if (!result.success) {
      console.error('MultiSize test failed:', result.error, result.googleError);
    }
    expect(result.success).toBe(true);

    const lineItems = lineItemRepo.findByCampaignId(campaign.id);
    expect(lineItems.length).toBe(3);
    for (const li of lineItems) {
      expect(li.lineItemType).toBe('SPONSORSHIP');
      expect(li.priority).toBe(4);
      expect(li.googleLineItemId).toBeDefined();
    }

    const creatives = creativeRepo.findByCampaignId(campaign.id);
    expect(creatives.length).toBe(3);
    for (const cr of creatives) {
      expect(cr.googleCreativeId).toBeDefined();
      const expectedKey = `${cr.width}x${cr.height}`;
      expect(cr.bannerUrl).toContain(`mock${expectedKey}data`);
    }
  });
});
