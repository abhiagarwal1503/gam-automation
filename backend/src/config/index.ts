import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appEnv: process.env.APP_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./gam_automation.db',
  useSqlite: !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.startsWith('sqlite:'),
  
  // Google Ad Manager Configurations
  gam: {
    networkCode: process.env.GOOGLE_AD_MANAGER_NETWORK_CODE || '22068249324',
    networkName: process.env.GOOGLE_AD_MANAGER_NETWORK_NAME || 'Live DFP Network',
    apiVersion: process.env.GAM_API_VERSION || 'v202511',
    applicationName: process.env.GAM_APPLICATION_NAME || 'GAM-Automation-System',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    serviceAccountKeyPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    defaultTimeZone: process.env.GAM_TIMEZONE || 'Asia/Kolkata',
    defaultCurrencyCode: process.env.GAM_CURRENCY || 'INR',
    soapEndpointBase: 'https://ads.google.com/apis/ads/publisher',
    oauthTokenUrl: 'https://oauth2.googleapis.com/token',
    oauthAuthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    oauthScope: 'https://www.googleapis.com/auth/dfp',
  },

  // Defaults
  defaults: {
    lineItemType: (process.env.DEFAULT_LINE_ITEM_TYPE || 'SPONSORSHIP') as any,
    priority: parseInt(process.env.DEFAULT_PRIORITY || '4', 10),
    costType: (process.env.DEFAULT_COST_TYPE || 'CPM') as any,
    deliveryRate: (process.env.DEFAULT_DELIVERY_RATE || 'EVENLY') as any,
    websitePrefix: process.env.DEFAULT_WEBSITE_PREFIX || 'newstrack',
    primaryPosition: process.env.DEFAULT_POSITION || 'homepage',
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'gam-secret-key-change-in-production-12345',
    adminApiKey: process.env.ADMIN_API_KEY || 'gam-admin-secret-key',
  }
};
