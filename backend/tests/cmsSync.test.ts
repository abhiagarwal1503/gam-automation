import { initDatabase, db } from '../src/database/db';
import { cmsPartnerRepo, campaignRepo, adUnitRepo, gptTagRepo } from '../src/repositories';
import { CmsSyncService } from '../src/services/cmsSyncService';

describe('CMS Integration & Partner Sync', () => {
  beforeAll(() => {
    initDatabase();
  });

  test('seeds default Hocalwire partner (The Federal Staging)', () => {
    const partners = cmsPartnerRepo.list();
    const federal = partners.find(p => p.id === 'partner_the_federal_staging' || p.endpoint.includes('stagingfederalsite.hocalwire.in'));

    expect(federal).toBeDefined();
    expect(federal?.endpoint).toContain('stagingfederalsite.hocalwire.in');
    expect(federal?.apiPath).toBe('/dev/h-api/news');
    expect(federal?.securityToken).toBe('1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG');
    expect(federal?.cmsType).toBe('HOCALWIRE');
    expect(federal?.autoSyncCampaigns).toBe(true);
    expect(federal?.autoSyncAdUnits).toBe(true);
    expect(federal?.isActive).toBe(true);
  });

  test('buildPartnerUrl normalizes endpoint domains and paths correctly', () => {
    const url1 = CmsSyncService.buildPartnerUrl('stagingfederalsite.hocalwire.in', '/dev/h-api/news');
    expect(url1).toBe('https://stagingfederalsite.hocalwire.in/dev/h-api/news');

    const url2 = CmsSyncService.buildPartnerUrl('https://stagingfederalsite.hocalwire.in/', 'dev/h-api/news');
    expect(url2).toBe('https://stagingfederalsite.hocalwire.in/dev/h-api/news');

    const url3 = CmsSyncService.buildPartnerUrl('http://my-cms.org', '/api/ads');
    expect(url3).toBe('http://my-cms.org/api/ads');
  });

  test('cmsPartnerRepo supports adding, updating, and querying active partners', () => {
    const testPartner = cmsPartnerRepo.create({
      name: 'Test Partner CMS',
      cmsType: 'WORDPRESS',
      endpoint: 'news.example.com',
      apiPath: '/wp-json/ads/v1',
      securityToken: 'test_token_12345',
      autoSyncCampaigns: true,
      autoSyncAdUnits: false,
      isActive: true
    });

    expect(testPartner.id).toBeDefined();
    expect(testPartner.name).toBe('Test Partner CMS');

    // Update partner
    const updated = cmsPartnerRepo.update(testPartner.id, {
      name: 'Updated Partner CMS',
      securityToken: 'updated_token_999'
    });

    expect(updated?.name).toBe('Updated Partner CMS');
    expect(updated?.securityToken).toBe('updated_token_999');

    // Query active
    const active = cmsPartnerRepo.findActive();
    expect(active.some(p => p.id === testPartner.id)).toBe(true);

    // Delete test partner
    const deleted = cmsPartnerRepo.delete(testPartner.id);
    expect(deleted).toBe(true);
  });
});
