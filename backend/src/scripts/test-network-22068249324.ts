import { GoogleAdManagerAuthService } from '../integrations/google-ad-manager/authService';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { initDatabase, db } from '../database/db';
import { settingsRepo } from '../repositories';

async function testNetwork() {
  const networkCode = '22068249324';
  console.log(`🔍 Testing Live GAM Network: ${networkCode}...`);
  initDatabase();

  // Update settings in database
  const current = settingsRepo.get() || {};
  current.networkCode = networkCode;
  settingsRepo.save(current);

  const token = await GoogleAdManagerAuthService.getAccessToken();
  if (!token) {
    console.error('❌ Failed to get access token');
    return;
  }
  console.log(`✅ Bearer Token generated`);

  // Call getCurrentNetwork
  const bodyXml = `<ns:getCurrentNetwork xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;
  const response = await soapClient.execute({
    service: 'NetworkService',
    action: 'getCurrentNetwork',
    bodyXml,
    networkCode
  }, token);

  console.log('\n--- Result from Google Ad Manager ---');
  console.log('Success:', response.success);
  if (response.success) {
    console.log('Network Data:', JSON.stringify(response.data, null, 2));
  } else {
    console.log('Error:', response.error);
    console.log('Google Error Details:', response.googleError);
    console.log('Suggested Action:', response.suggestedAction);
  }
}

testNetwork();
