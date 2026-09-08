export type CampaignStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'CREATING_ADVERTISER'
  | 'ADVERTISER_READY'
  | 'CREATING_AD_UNIT'
  | 'AD_UNIT_CREATED'
  | 'CREATING_ORDER'
  | 'ORDER_CREATED'
  | 'CREATING_LINE_ITEM'
  | 'LINE_ITEM_CREATED'
  | 'CREATING_CREATIVE'
  | 'CREATIVE_CREATED'
  | 'ASSOCIATING_CREATIVE'
  | 'CREATIVE_ASSOCIATED'
  | 'READY'
  | 'FAILED'
  | 'PAUSED'
  | 'COMPLETED';

export interface AdSize {
  width: number;
  height: number;
  label?: string;
  isDefault?: boolean;
  enabled?: boolean;
}

export interface Advertiser {
  id: string;
  name: string;
  googleAdvertiserId?: string;
  status: string;
  networkCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdUnit {
  id: string;
  name: string;
  code: string;
  googleAdUnitId?: string;
  parentGoogleAdUnitId?: string;
  sizes: AdSize[];
  status: string;
  networkCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  campaignId: string;
  googleOrderId?: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  campaignId: string;
  orderId: string;
  googleLineItemId?: string;
  name: string;
  size: AdSize;
  startDate: string;
  endDate: string;
  lineItemType: string;
  costType: string;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  lineItemId?: string;
  googleCreativeId?: string;
  name: string;
  bannerUrl: string;
  targetUrl: string;
  width: number;
  height: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GptTag {
  id: string;
  campaignId: string;
  adUnitId?: string;
  size: AdSize;
  divId: string;
  headCode: string;
  bodyCode: string;
  completeCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLog {
  id: string;
  campaignId?: string;
  operation: string;
  service: string;
  requestData: any;
  responseData: any;
  status: 'SUCCESS' | 'ERROR' | 'DRY_RUN';
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  customName?: string;
  advertiserId?: string;
  advertiserName: string;
  bannerUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  sizes: AdSize[];
  position?: string;
  status: CampaignStatus;
  currentStep?: string;
  errorMessage?: string;
  googleErrorDetails?: string;
  suggestedAction?: string;
  isDryRun: boolean;
  cmsSyncStatus?: string;
  cmsSyncedAt?: string;
  networkCode?: string;
  createdBy?: string;
  creatorEmail?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  lineItems?: LineItem[];
  creatives?: Creative[];
  gptTags?: GptTag[];
  logs?: ApiLog[];
}

export interface SystemSettings {
  networkCode: string;
  networkName?: string;
  timeZone: string;
  currencyCode: string;
  apiVersion: string;
  defaultLineItemType: string;
  defaultPriority: number;
  defaultCostType: string;
  defaultDeliveryRate: string;
  namingPrefix: string;
  isConfigured: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  availableSizes: AdSize[];
  isConnected?: boolean;
  slackWebhookUrl?: string;
  emailWebhookUrl?: string;
  alertEmailRecipient?: string;
  webhooksEnabled?: boolean;
  hasServiceAccount?: boolean;
  serviceAccountEmail?: string;
  serviceAccountProjectId?: string;
  serviceAccountKey?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'trafficker' | 'viewer' | 'publisher' | 'adops';
  avatar?: string;
  networkCode?: string; // e.g. '22068249324', or 'ALL' for admin
  partnerName?: string; // e.g. 'Blinkcorp Technologies Private Limited'
  advertiserId?: string; // e.g. '6155963446' or 'ALL' for all partner advertisers
  advertiserName?: string; // e.g. 'TechStar Brand' or 'All Advertisers'
  status?: 'active' | 'deactivated';
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserAuditAction = 'USER_CREATED' | 'USER_UPDATED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED' | 'USER_STATUS_CHANGED' | 'USER_DELETED';

export interface UserAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  action: UserAuditAction;
  details?: Record<string, any>;
  createdAt: string;
}

export type CmsType = 'HOCALWIRE' | 'WORDPRESS' | 'GENERIC_WEBHOOK';

export interface CmsPartner {
  id: string;
  name: string;
  cmsType: CmsType;
  endpoint: string;
  apiPath: string;
  securityToken: string; // s-d token
  autoSyncCampaigns: boolean;
  autoSyncAdUnits: boolean;
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'ERROR';
  lastSyncMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsSyncResult {
  success: boolean;
  partnerId: string;
  partnerName: string;
  endpoint: string;
  statusCode?: number;
  message?: string;
  error?: string;
  responseData?: any;
  durationMs?: number;
}

export interface CmsElement {
  id: string;
  name: string;
  divId: string;
  slotCode: string;
  fullSlotPath?: string;
  networkCode?: string;
  width: number;
  height: number;
  rawCall?: string;
  sourceUrl?: string;
}

export interface PushDfpResult {
  success: boolean;
  partnerId: string;
  partnerName: string;
  endpoint: string;
  element: CmsElement;
  networkCode: string;
  generatedSnippet: string;
  headCode: string;
  bodyCode: string;
  completeCode: string;
  statusCode?: number;
  responseData?: any;
  message?: string;
  error?: string;
  timestamp: string;
}



