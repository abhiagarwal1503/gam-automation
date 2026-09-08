import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';

export class GoogleAdManagerOrderService {
  /**
   * Searches for an Order by name in GAM
   */
  public static async findOrderByName(
    orderName: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string; name: string } | null> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanName = orderName.replace(/'/g, "\\'");

    const bodyXml = `
      <ns:getOrdersByStatement>
        <ns:filterStatement>
          <ns:query>WHERE name = '${cleanName}' LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getOrdersByStatement>
    `;

    const response = await soapClient.execute({
      service: 'OrderService',
      action: 'getOrdersByStatement',
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
          name: String(results[0].name || orderName)
        };
      }
    }

    return null;
  }

  /**
   * Creates a new Order in GAM for the specified advertiser.
   * traffickerId is REQUIRED by GAM — it's the ID of the user who traffics the order.
   */
  public static async createOrder(
    name: string,
    googleAdvertiserId: string,
    traffickerId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanAdvertiserId = String(googleAdvertiserId || '').replace(/^ADV-/, '').trim();

    const bodyXml = `
      <ns:createOrders>
        <ns:orders>
          <ns:name>${name}</ns:name>
          <ns:advertiserId>${cleanAdvertiserId}</ns:advertiserId>
          <ns:traffickerId>${traffickerId}</ns:traffickerId>
        </ns:orders>
      </ns:createOrders>
    `;

    const response = await soapClient.execute({
      service: 'OrderService',
      action: 'createOrders',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create Order in Google Ad Manager.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Check advertiser ID, trafficker ID and GAM Order permissions.'
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

  /**
   * Automatically approves an Order in Google Ad Manager (ApproveOrders action)
   */
  public static async approveOrder(
    orderId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ success: boolean; error?: string; googleError?: string; suggestedAction?: string }> {
    if (isDryRun) {
      return { success: true };
    }

    const token = await GoogleAdManagerAuthService.getAccessToken();

    // First try ApproveAndOverbookOrders (safely bypasses ForecastingError.NOT_ENOUGH_INVENTORY for sponsorship/immediate bookings)
    let bodyXml = `
      <ns:performOrderAction>
        <ns:orderAction xsi:type="ns:ApproveAndOverbookOrders" />
        <ns:filterStatement>
          <ns:query>WHERE id = ${orderId}</ns:query>
        </ns:filterStatement>
      </ns:performOrderAction>
    `;

    let response = await soapClient.execute({
      service: 'OrderService',
      action: 'performOrderAction',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) {
      // Fallback to standard ApproveOrders
      bodyXml = `
        <ns:performOrderAction>
          <ns:orderAction xsi:type="ns:ApproveOrders" />
          <ns:filterStatement>
            <ns:query>WHERE id = ${orderId}</ns:query>
          </ns:filterStatement>
        </ns:performOrderAction>
      `;

      response = await soapClient.execute({
        service: 'OrderService',
        action: 'performOrderAction',
        bodyXml,
        networkCode,
        campaignId,
        isDryRun
      }, token || undefined);
    }

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to auto-approve Order in GAM.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Check order approval permissions in Google Ad Manager.'
      };
    }

    return {
      success: true
    };
  }
}

