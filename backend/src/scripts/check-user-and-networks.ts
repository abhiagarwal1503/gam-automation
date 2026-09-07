import { GoogleAdManagerAuthService } from '../integrations/google-ad-manager/authService';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { initDatabase } from '../database/db';

async function checkUserAndNetworks() {
  initDatabase();
  console.log('🔍 Checking Current User in GAM...');

  const token = await GoogleAdManagerAuthService.getAccessToken();
  if (!token) {
    console.error('❌ Failed to obtain token');
    return;
  }

  // Check UserService on Blinkcorp (22068249324) and News Track (22212039110)
  for (const netCode of ['22068249324', '22212039110']) {
    console.log(`\n========================================`);
    console.log(`Testing Network: ${netCode}`);
    console.log(`========================================`);

    // 1. getCurrentUser
    const userXml = `<ns:getCurrentUser xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;
    const userRes = await soapClient.execute({
      service: 'UserService',
      action: 'getCurrentUser',
      bodyXml: userXml,
      networkCode: netCode
    }, token);

    console.log('UserService.getCurrentUser success:', userRes.success);
    if (userRes.success) {
      console.log('User Details:', JSON.stringify(userRes.data, null, 2));
    } else {
      console.log('User Error:', userRes.error, userRes.googleError);
    }

    // 2. getCompaniesByStatement
    const compXml = `
      <ns:getCompaniesByStatement>
        <ns:filterStatement>
          <ns:query>WHERE type = 'ADVERTISER' LIMIT 5</ns:query>
        </ns:filterStatement>
      </ns:getCompaniesByStatement>
    `;
    const compRes = await soapClient.execute({
      service: 'CompanyService',
      action: 'getCompaniesByStatement',
      bodyXml: compXml,
      networkCode: netCode
    }, token);

    console.log('CompanyService.getCompaniesByStatement success:', compRes.success);
    if (compRes.success) {
      console.log('Companies:', JSON.stringify(compRes.data, null, 2));
    } else {
      console.log('Company Error:', compRes.error, compRes.googleError);
    }
  }
}

checkUserAndNetworks();
