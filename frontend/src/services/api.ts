import axios from 'axios';
import {
  Campaign,
  AdUnit,
  Advertiser,
  GptTag,
  ApiLog,
  SystemSettings,
  AdSize,
  User,
  UserAuditLog,
  CmsPartner,
  CmsSyncResult,
  CmsElement,
  PushDfpResult
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api').replace(/\/+api$/, '/api');

// Attach authorization header if session token exists
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('gam_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Campaigns
  async getCampaigns(networkCode?: string, advertiser?: string): Promise<Campaign[]> {
    const params: any = {};
    if (networkCode && networkCode !== 'ALL') params.networkCode = networkCode;
    if (advertiser && advertiser !== 'ALL' && advertiser !== 'All Advertisers') params.advertiser = advertiser;
    const res = await axios.get(`${API_BASE}/campaigns`, { params: Object.keys(params).length > 0 ? params : undefined });
    return res.data.data;
  },

  async getCampaign(id: string): Promise<Campaign> {
    const res = await axios.get(`${API_BASE}/campaigns/${id}`);
    return res.data.data;
  },

  async createCampaign(data: {
    advertiserName: string;
    customName?: string;
    advertiserId?: string;
    networkCode?: string;
    bannerUrl: string;
    targetUrl: string;
    startDate: string;
    endDate: string;
    sizes: AdSize[];
    position?: string;
    isDryRun?: boolean;
    createdBy?: string;
    creatorEmail?: string;
  }): Promise<{ campaignId: string; status: string; data: Campaign }> {
    const res = await axios.post(`${API_BASE}/campaigns`, data);
    return res.data;
  },

  async runCampaign(id: string): Promise<any> {
    const res = await axios.post(`${API_BASE}/campaigns/${id}/run`);
    return res.data;
  },

  async retryCampaign(id: string): Promise<Campaign> {
    const res = await axios.post(`${API_BASE}/campaigns/${id}/retry`);
    return res.data.data;
  },

  async pauseCampaign(id: string): Promise<Campaign> {
    const res = await axios.post(`${API_BASE}/campaigns/${id}/pause`);
    return res.data.data;
  },

  async resumeCampaign(id: string): Promise<Campaign> {
    const res = await axios.post(`${API_BASE}/campaigns/${id}/resume`);
    return res.data.data;
  },

  async deleteCampaign(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await axios.delete(`${API_BASE}/campaigns/${id}`);
    return res.data;
  },

  async bulkUpdateCreativeBanners(
    campaignId: string,
    data: { banners?: Record<string, string>; defaultBannerUrl?: string }
  ): Promise<{ success: boolean; message: string; data: any[] }> {
    const res = await axios.post(`${API_BASE}/campaigns/${campaignId}/creatives/bulk-update`, data);
    return res.data;
  },

  // Ad Units
  async getAdUnits(networkCode?: string): Promise<AdUnit[]> {
    const params = networkCode && networkCode !== 'ALL' ? { networkCode } : undefined;
    const res = await axios.get(`${API_BASE}/ad-units`, { params });
    return res.data.data;
  },

  async createAdUnit(data: {
    name: string;
    code: string;
    sizes: AdSize[];
    parentGoogleAdUnitId?: string;
    networkCode?: string;
  }): Promise<AdUnit> {
    const res = await axios.post(`${API_BASE}/ad-units`, data);
    return res.data.data;
  },

  async deleteAdUnit(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await axios.delete(`${API_BASE}/ad-units/${id}`);
    return res.data;
  },

  // Advertisers (local DB)
  async getAdvertisers(networkCode?: string): Promise<Advertiser[]> {
    const params = networkCode ? { networkCode } : undefined;
    const res = await axios.get(`${API_BASE}/advertisers`, { params });
    return res.data.data;
  },

  async createAdvertiser(data: { name: string; networkCode?: string; googleAdvertiserId?: string }): Promise<Advertiser> {
    const res = await axios.post(`${API_BASE}/advertisers`, data);
    return res.data.data;
  },

  async deleteAdvertiser(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await axios.delete(`${API_BASE}/advertisers/${id}`);
    return res.data;
  },

  // Live GAM Data
  async getNetworks(): Promise<{ name: string; code: string }[]> {
    const res = await axios.get(`${API_BASE}/gam/networks`);
    return res.data.data;
  },

  async getGamAdvertisers(networkCode: string): Promise<{ id: string; name: string }[]> {
    const res = await axios.get(`${API_BASE}/gam/advertisers?networkCode=${encodeURIComponent(networkCode)}`);
    return res.data.data || [];
  },

  async syncGamAdvertisers(networkCode: string = '22068249324'): Promise<{ count: number; message: string; data: Advertiser[] }> {
    const res = await axios.post(`${API_BASE}/gam/advertisers/sync`, { networkCode });
    return res.data;
  },

  // GPT Generator
  async generateGptTags(data: {
    networkCode?: string;
    adUnitCode: string;
    size: AdSize;
    divId?: string;
  }): Promise<{ divId: string; headCode: string; bodyCode: string; completeCode: string }> {
    const res = await axios.post(`${API_BASE}/gpt/generate`, data);
    return res.data.data;
  },

  async getCampaignGptTags(campaignId: string): Promise<GptTag[]> {
    const res = await axios.get(`${API_BASE}/gpt/${campaignId}`);
    return res.data.data;
  },

  // Logs
  async getLogs(limit: number = 100): Promise<ApiLog[]> {
    const res = await axios.get(`${API_BASE}/logs?limit=${limit}`);
    return res.data.data;
  },

  async clearLogs(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const res = await axios.delete(`${API_BASE}/logs`);
    return res.data;
  },

  async getCampaignLogs(campaignId: string): Promise<ApiLog[]> {
    const res = await axios.get(`${API_BASE}/logs/${campaignId}`);
    return res.data.data;
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await axios.get(`${API_BASE}/settings`);
    return res.data.data;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await axios.put(`${API_BASE}/settings`, data);
    return res.data.data;
  },

  async testGamConnection(networkCode?: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    googleError?: string;
    suggestedAction?: string;
    network?: any;
  }> {
    const res = await axios.post(`${API_BASE}/settings/test-connection`, { networkCode });
    return res.data;
  },

  async testWebhook(): Promise<{ success: boolean; message: string; result?: any }> {
    const res = await axios.post(`${API_BASE}/settings/test-webhook`);
    return res.data;
  },

  // User Auth & Session
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: User['role'];
    networkCode?: string;
    partnerName?: string;
    advertiserId?: string;
    advertiserName?: string;
    status?: 'active' | 'deactivated';
    mustChangePassword?: boolean;
  }): Promise<{ user: User; token: string }> {
    const res = await axios.post(`${API_BASE}/auth/register`, data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await axios.post(`${API_BASE}/auth/login`, data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data.data;
  },

  async getUsers(): Promise<User[]> {
    const res = await axios.get(`${API_BASE}/auth/users`);
    return res.data.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await axios.put(`${API_BASE}/auth/users/${id}`, data);
    return res.data.data;
  },

  async resetUserPassword(id: string, options?: { newPassword?: string; mustChangePassword?: boolean }): Promise<{ temporaryPassword: string; mustChangePassword: boolean }> {
    const res = await axios.post(`${API_BASE}/auth/users/${id}/reset-password`, options || {});
    return res.data.data;
  },

  async toggleUserStatus(id: string, status: 'active' | 'deactivated'): Promise<User> {
    const res = await axios.post(`${API_BASE}/auth/users/${id}/toggle-status`, { status });
    return res.data.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axios.delete(`${API_BASE}/auth/users/${id}`);
    return res.data;
  },

  async changePassword(data: { currentPassword?: string; newPassword: string }): Promise<{ user: User }> {
    const res = await axios.post(`${API_BASE}/auth/change-password`, data);
    return res.data.data;
  },

  async getUserAuditLogs(): Promise<UserAuditLog[]> {
    const res = await axios.get(`${API_BASE}/auth/users/audit-logs`);
    return res.data.data;
  },

  // Reports & Performance
  async getReports(filters?: {
    networkCode?: string;
    adSlot?: string;
    position?: string;
    advertiser?: string;
    status?: string;
    dateRange?: string;
  }): Promise<{
    summary: any;
    data: any[];
    dailyTrends?: { date: string; label: string; impressions: number; clicks: number; ctr: string; revenue: number }[];
    deviceBreakdown?: {
      mobile: { percentage: number; impressions: number; clicks: number };
      desktop: { percentage: number; impressions: number; clicks: number };
      tablet: { percentage: number; impressions: number; clicks: number };
    };
    slotBreakdown?: { size: string; impressions: number; clicks: number; ctr: string; sharePct: number }[];
  }> {
    const params = new URLSearchParams();
    if (filters?.networkCode && filters.networkCode !== 'all') params.append('networkCode', filters.networkCode);
    if (filters?.adSlot && filters.adSlot !== 'all') params.append('adSlot', filters.adSlot);
    if (filters?.position && filters.position !== 'all') params.append('position', filters.position);
    if (filters?.advertiser && filters.advertiser !== 'all') params.append('advertiser', filters.advertiser);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await axios.get(`${API_BASE}/reports${queryString}`);
    return res.data;
  },

  async getCampaignReport(campaignId: string): Promise<{ summary: any; data: any }> {
    const res = await axios.get(`${API_BASE}/reports/${campaignId}`);
    return res.data;
  },

  // Inventory Forecaster
  async checkInventoryForecast(data: {
    networkCode?: string;
    adUnitCode?: string;
    startDate: string;
    endDate: string;
    lineItemType?: string;
    priority?: number;
  }): Promise<{ success: boolean; data: any }> {
    const res = await axios.post(`${API_BASE}/forecast/availability`, data);
    return res.data;
  },

  // Google Auth
  async getAuthStatus(): Promise<{ connected: boolean }> {
    const res = await axios.get(`${API_BASE}/auth/google/status`);
    return res.data;
  },

  async getAuthUrl(): Promise<string> {
    const res = await axios.get(`${API_BASE}/auth/google/url`);
    return res.data.url;
  },

  // CMS & Partner Webhook Sync
  async getCmsPartners(): Promise<CmsPartner[]> {
    const res = await axios.get(`${API_BASE}/cms/partners`);
    return res.data.data;
  },

  async createCmsPartner(data: Partial<CmsPartner>): Promise<CmsPartner> {
    const res = await axios.post(`${API_BASE}/cms/partners`, data);
    return res.data.data;
  },

  async updateCmsPartner(id: string, data: Partial<CmsPartner>): Promise<CmsPartner> {
    const res = await axios.put(`${API_BASE}/cms/partners/${id}`, data);
    return res.data.data;
  },

  async deleteCmsPartner(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axios.delete(`${API_BASE}/cms/partners/${id}`);
    return res.data;
  },

  async testCmsPartner(data: {
    endpoint?: string;
    apiPath?: string;
    securityToken?: string;
    partnerId?: string;
    name?: string;
  }): Promise<{ success: boolean; data: CmsSyncResult }> {
    const res = await axios.post(`${API_BASE}/cms/test`, data);
    return res.data;
  },

  async syncCampaignToCms(campaignId: string, partnerId?: string): Promise<{ success: boolean; data: CmsSyncResult[] }> {
    const res = await axios.post(`${API_BASE}/cms/sync/campaign/${campaignId}`, { partnerId });
    return res.data;
  },

  async syncAdUnitsToCms(data?: { adUnitIds?: string[]; partnerId?: string }): Promise<{ success: boolean; data: CmsSyncResult[] }> {
    const res = await axios.post(`${API_BASE}/cms/sync/ad-units`, data || {});
    return res.data;
  },

  async fetchPartnerElements(params?: { partnerId?: string; url?: string }): Promise<{
    partner: CmsPartner | null;
    targetUrl: string;
    elements: CmsElement[];
    source: string;
  }> {
    const res = await axios.post(`${API_BASE}/cms/fetch-elements`, params || {});
    return res.data.data;
  },

  async pushElementDfp(params: {
    partnerId?: string;
    element: Partial<CmsElement> & { divId: string; slotCode: string; width: number; height: number };
    networkCode?: string;
    customSnippet?: string;
  }): Promise<PushDfpResult> {
    const res = await axios.post(`${API_BASE}/cms/push-element-dfp`, params);
    return res.data.data;
  }
};

