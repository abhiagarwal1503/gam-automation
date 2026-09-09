import request from 'supertest';
import { createApp } from '../src/app';

describe('Backend API Endpoints', () => {
  const app = createApp();

  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/campaigns validates required fields', async () => {
    const res = await request(app).post('/api/campaigns').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/campaigns creates campaign successfully', async () => {
    const payload = {
      advertiserName: 'Nike Inc',
      bannerUrl: 'https://example.com/banner.jpg',
      targetUrl: 'https://nike.com',
      startDate: '2026-08-20',
      endDate: '2026-08-30',
      sizes: [{ width: 300, height: 250 }],
      isDryRun: true
    };

    const res = await request(app).post('/api/campaigns').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.campaignId).toBeDefined();
  });

  test('POST /api/gpt/generate returns head and body tags', async () => {
    const res = await request(app).post('/api/gpt/generate').send({
      networkCode: '12345678',
      adUnitCode: 'newstrack_homepage_300x250',
      size: { width: 300, height: 250 }
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.headCode).toContain('googletag.defineSlot');
    expect(res.body.data.bodyCode).toContain('id=');
    expect(res.body.data.bodyCode).toContain('div-gpt-ad');
  });

  test('GET /api/settings returns configuration with masked secrets', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.networkCode).toBeDefined();
  });
});
