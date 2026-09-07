import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';

export class GoogleAdManagerCompanyService {
  /**
   * Search for an existing advertiser company by name in GAM
   */
  public static async findAdvertiserByName(
    name: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string; name: string } | null> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanName = name.replace(/'/g, "\\'");
    
    const bodyXml = `
      <ns:getCompaniesByStatement>
        <ns:filterStatement>
          <ns:query>WHERE name = '${cleanName}' AND type = 'ADVERTISER' LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getCompaniesByStatement>
    `;

    const response = await soapClient.execute({
      service: 'CompanyService',
      action: 'getCompaniesByStatement',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      return null;
    }

    const rval = response.data?.rval;
    if (rval && rval.results) {
      const results = Array.isArray(rval.results) ? rval.results : [rval.results];
      if (results.length > 0 && results[0].id) {
        return {
          id: String(results[0].id),
          name: String(results[0].name || name)
        };
      }
    }

    return null;
  }

  /**
   * Create a new advertiser company in GAM
   */
  public static async createAdvertiser(
    name: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();

    const bodyXml = `
      <ns:createCompanies>
        <ns:companies>
          <ns:name>${name}</ns:name>
          <ns:type>ADVERTISER</ns:type>
        </ns:companies>
      </ns:createCompanies>
    `;

    const response = await soapClient.execute({
      service: 'CompanyService',
      action: 'createCompanies',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create advertiser in Google Ad Manager.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Check Google Ad Manager permissions to create companies.'
      };
    }

    const rval = response.data?.rval;
    const created = Array.isArray(rval) ? rval[0] : rval;
    const id = created?.id ? String(created.id) : undefined;

    return {
      success: true,
      id
    };
  }
}
