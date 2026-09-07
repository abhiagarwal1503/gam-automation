import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';

export class GoogleAdManagerAssociationService {
  /**
   * Associates a Creative with a Line Item in GAM (LICA)
   */
  public static async associateCreativeWithLineItem(
    lineItemId: string,
    creativeId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();

    const bodyXml = `
      <ns:createLineItemCreativeAssociations>
        <ns:lineItemCreativeAssociations>
          <ns:lineItemId>${lineItemId}</ns:lineItemId>
          <ns:creativeId>${creativeId}</ns:creativeId>
          <ns:status>ACTIVE</ns:status>
        </ns:lineItemCreativeAssociations>
      </ns:createLineItemCreativeAssociations>
    `;

    const response = await soapClient.execute({
      service: 'LineItemCreativeAssociationService',
      action: 'createLineItemCreativeAssociations',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      // If the association already exists in GAM, consider it a success
      if (
        response.googleError?.includes('ALREADY_EXISTS') ||
        response.error?.includes('ALREADY_EXISTS')
      ) {
        return {
          success: true,
          id: `${lineItemId}_${creativeId}`
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to associate Creative with Line Item.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Ensure creative size matches line item creative placeholder size.'
      };
    }

    const rval = response.data?.rval;
    const created = Array.isArray(rval) ? rval[0] : rval;
    const id = created ? `${lineItemId}_${creativeId}` : `${lineItemId}_${creativeId}`;

    return {
      success: true,
      id
    };
  }

  /**
   * Checks if an association already exists between a line item and creative in GAM
   */
  public static async findAssociation(
    lineItemId: string,
    creativeId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string } | null> {
    if (isDryRun) return null;
    const token = await GoogleAdManagerAuthService.getAccessToken();

    const bodyXml = `
      <ns:getLineItemCreativeAssociationsByStatement>
        <ns:filterStatement>
          <ns:query>WHERE lineItemId = ${lineItemId} AND creativeId = ${creativeId} LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getLineItemCreativeAssociationsByStatement>
    `;

    const response = await soapClient.execute({
      service: 'LineItemCreativeAssociationService',
      action: 'getLineItemCreativeAssociationsByStatement',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) return null;

    const rval = response.data?.rval;
    if (rval && rval.results) {
      const results = Array.isArray(rval.results) ? rval.results : [rval.results];
      if (results.length > 0) {
        return { id: `${lineItemId}_${creativeId}` };
      }
    }
    return null;
  }
}
