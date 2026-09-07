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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trafficker' | 'publisher' | 'adops';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

