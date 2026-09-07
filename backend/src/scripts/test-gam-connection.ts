import { GoogleAdManagerAuthService } from '../integrations/google-ad-manager/authService';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { initDatabase } from '../database/db';
import { settingsRepo } from '../repositories';

async function testConnection() {
  console.log('🔍 Testing Google Ad Manager Service Account Authentication...');
  initDatabase();

  const serviceAccount = GoogleAdManagerAuthService.getServiceAccount();
  if (!serviceAccount) {
    console.error('❌ No service account found!');
    return;
  }
  console.log(`✅ Loaded Service Account: ${serviceAccount.client_email}`);

  try {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    if (!token) {
      console.error('❌ Failed to obtain OAuth2 access token.');
      return;
    }
    console.log(`✅ Successfully generated Bearer Access Token (prefix: ${token.substring(0, 15)}...)`);

    const bodyXml = `<ns:getAllNetworks xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;

    const response = await soapClient.execute({
      service: 'NetworkService',
      action: 'getAllNetworks',
      bodyXml,
      networkCode: '0'
    }, token);

    console.log('Raw XML / Data:', JSON.stringify(response.data, null, 2));
    if (response.rawXml) {
      console.log('Raw SOAP XML:', response.rawXml);
    }

  } catch (err: any) {
    console.error('❌ Connection test error:', err.response?.data || err.message);
  }
}

testConnection();
