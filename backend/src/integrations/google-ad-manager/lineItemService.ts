import { soapClient } from './soapClient';
import { GoogleAdManagerAuthService } from './authService';
import { GoogleAdManagerNetworkService } from './networkService';
import { AdSize, LineItemType, CostType } from '../../types';
import { config } from '../../config';

export interface CreateLineItemParams {
  orderId: string;
  name: string;
  size: AdSize;
  googleAdUnitId: string;
  startDate: string;
  endDate: string;
  lineItemType?: LineItemType;
  priority?: number;
  costType?: CostType;
  costPerUnitMicroAmount?: number;
  unitsBought?: number;
  timeZoneId?: string;
  currencyCode?: string;
  networkCode?: string;
  campaignId?: string;
  isDryRun?: boolean;
}

export class GoogleAdManagerLineItemService {
  /**
   * Parses YYYY-MM-DD string accurately without timezone shifting
   */
  private static parseDateParts(dateStr: string): {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
  } {
    let hour: number | undefined;
    let minute: number | undefined;

    if (dateStr.includes('T')) {
      const [dPart, tPart] = dateStr.split('T');
      if (tPart) {
        const timeParts = tPart.split(':');
        if (timeParts.length >= 2) {
          const h = parseInt(timeParts[0], 10);
          const m = parseInt(timeParts[1], 10);
          if (!isNaN(h)) hour = h;
          if (!isNaN(m)) minute = m;
        }
      }
      const dParts = dPart.split('-');
      if (dParts.length === 3) {
        return {
          year: parseInt(dParts[0], 10),
          month: parseInt(dParts[1], 10),
          day: parseInt(dParts[2], 10),
          hour,
          minute
        };
      }
    }

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10)
      };
    }
    const d = new Date(dateStr);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: isNaN(d.getHours()) ? undefined : d.getHours(),
      minute: isNaN(d.getMinutes()) ? undefined : d.getMinutes()
    };
  }

  /**
   * Converts a date string (YYYY-MM-DD or ISO / YYYY-MM-DDTHH:mm) to GAM SOAP DateTime XML
   */
  private static formatDateToGamXml(
    dateStr: string,
    isEnd: boolean,
    timeZoneId: string
  ): string {
    const { year, month, day, hour: parsedHour, minute: parsedMinute } = this.parseDateParts(dateStr);
    const hour = parsedHour !== undefined ? parsedHour : (isEnd ? 23 : 0);
    const minute = parsedMinute !== undefined ? parsedMinute : (isEnd ? 59 : 0);
    const second = isEnd ? 59 : 0;

    return `
      <ns:date>
        <ns:year>${year}</ns:year>
        <ns:month>${month}</ns:month>
        <ns:day>${day}</ns:day>
      </ns:date>
      <ns:hour>${hour}</ns:hour>
      <ns:minute>${minute}</ns:minute>
      <ns:second>${second}</ns:second>
      <ns:timeZoneId>${timeZoneId}</ns:timeZoneId>
    `;
  }

  /**
   * Returns correct GAM line item settings based on lineItemType.
   * GAM enforces strict rules per type for priority, goalType, and units.
   *
   * STANDARD:     priority 8,  goalType LIFETIME, unitType IMPRESSIONS, units = impressions count
   * SPONSORSHIP:  priority 4,  goalType NONE,     unitType IMPRESSIONS, units = 0 (no goal needed)
   * NETWORK:      priority 12, goalType NONE,     unitType IMPRESSIONS, units = 0
   * BULK:         priority 12, goalType LIFETIME, unitType IMPRESSIONS, units = impressions count
   * HOUSE:        priority 16, goalType NONE,     unitType IMPRESSIONS, units = 0
   */
  private static getLineItemGoalSettings(lineItemType: LineItemType, requestedUnits: number): {
    priority: number;
    goalTypeXml: string;
    unitsXml: string;
  } {
    switch (lineItemType) {
      case 'STANDARD':
        return {
          priority: 8,
          goalTypeXml: `
            <ns:primaryGoal>
              <ns:goalType>LIFETIME</ns:goalType>
              <ns:unitType>IMPRESSIONS</ns:unitType>
              <ns:units>${requestedUnits}</ns:units>
            </ns:primaryGoal>`,
          unitsXml: ''
        };
      case 'SPONSORSHIP':
        return {
          priority: 4,
          goalTypeXml: `
            <ns:primaryGoal>
              <ns:goalType>DAILY</ns:goalType>
              <ns:unitType>IMPRESSIONS</ns:unitType>
              <ns:units>100</ns:units>
            </ns:primaryGoal>`,
          unitsXml: ''
        };
      case 'NETWORK':
        return {
          priority: 12,
          goalTypeXml: `
            <ns:primaryGoal>
              <ns:goalType>NONE</ns:goalType>
              <ns:unitType>IMPRESSIONS</ns:unitType>
              <ns:units>0</ns:units>
            </ns:primaryGoal>`,
          unitsXml: ''
        };
      case 'HOUSE':
        return {
          priority: 16,
          goalTypeXml: `
            <ns:primaryGoal>
              <ns:goalType>NONE</ns:goalType>
              <ns:unitType>IMPRESSIONS</ns:unitType>
              <ns:units>0</ns:units>
            </ns:primaryGoal>`,
          unitsXml: ''
        };
      default:
        // Default to STANDARD
        return {
          priority: 8,
          goalTypeXml: `
            <ns:primaryGoal>
              <ns:goalType>LIFETIME</ns:goalType>
              <ns:unitType>IMPRESSIONS</ns:unitType>
              <ns:units>${requestedUnits}</ns:units>
            </ns:primaryGoal>`,
          unitsXml: ''
        };
    }
  }

  /**
   * Creates a new Line Item in GAM targeted to the specified Ad Unit.
   * Correct field order per GAM v202511 XSD:
   * orderId → name → startDateTime → startDateTimeType → endDateTime →
   * lineItemType → priority → costPerUnit → costType →
   * creativePlaceholders → primaryGoal → targeting
   */
  public static async createLineItem(
    params: CreateLineItemParams
  ): Promise<{ success: boolean; id?: string; error?: string; googleError?: string; suggestedAction?: string }> {
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const timeZone = params.timeZoneId || config.gam.defaultTimeZone;
    const lineItemType = params.lineItemType || config.defaults.lineItemType || 'STANDARD';
    const costType = params.costType || config.defaults.costType || 'CPM';
    const microAmount = params.costPerUnitMicroAmount || 1000000; // ₹1.00 or $1.00 CPM default
    const unitsBought = params.unitsBought || 100000;

    const goalSettings = this.getLineItemGoalSettings(lineItemType, unitsBought);
    const priority = params.priority || goalSettings.priority;

    const { year, month, day } = this.parseDateParts(params.startDate);
    const startObj = new Date(year, month - 1, day, 0, 0, 0);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    // If start date is today or in past, use IMMEDIATELY so GAM activates it right away without START_DATE_TIME_IS_IN_PAST error
    const isImmediate = startObj.getTime() <= todayObj.getTime();
    const startDateTimeType = isImmediate ? 'IMMEDIATELY' : 'USE_START_DATE_TIME';

    const startDateTimeXml = isImmediate
      ? ''
      : `
          <ns:startDateTime>
            ${this.formatDateToGamXml(params.startDate, false, timeZone)}
          </ns:startDateTime>
        `;
    const endDateTimeXml = this.formatDateToGamXml(params.endDate, true, timeZone);

    const bodyXml = `
      <ns:createLineItems>
        <ns:lineItems>
          <ns:orderId>${params.orderId}</ns:orderId>
          <ns:name>${params.name}</ns:name>
          ${startDateTimeXml}
          <ns:startDateTimeType>${startDateTimeType}</ns:startDateTimeType>
          <ns:endDateTime>
            ${endDateTimeXml}
          </ns:endDateTime>
          <ns:lineItemType>${lineItemType}</ns:lineItemType>
          <ns:priority>${priority}</ns:priority>
          <ns:costPerUnit>
            <ns:currencyCode>${(params.currencyCode || config.gam.defaultCurrencyCode || 'USD').trim().toUpperCase()}</ns:currencyCode>
            <ns:microAmount>${microAmount}</ns:microAmount>
          </ns:costPerUnit>
          <ns:costType>${costType}</ns:costType>
          <ns:creativePlaceholders>
            <ns:size>
              <ns:width>${params.size.width}</ns:width>
              <ns:height>${params.size.height}</ns:height>
              <ns:isAspectRatio>false</ns:isAspectRatio>
            </ns:size>
          </ns:creativePlaceholders>
          <ns:allowOverbook>true</ns:allowOverbook>
          <ns:skipInventoryCheck>true</ns:skipInventoryCheck>
          ${goalSettings.goalTypeXml}
          <ns:targeting>
            <ns:inventoryTargeting>
              <ns:targetedAdUnits>
                <ns:adUnitId>${params.googleAdUnitId}</ns:adUnitId>
                <ns:includeDescendants>true</ns:includeDescendants>
              </ns:targetedAdUnits>
            </ns:inventoryTargeting>
          </ns:targeting>
        </ns:lineItems>
      </ns:createLineItems>
    `;

    const response = await soapClient.execute({
      service: 'LineItemService',
      action: 'createLineItems',
      bodyXml,
      networkCode: params.networkCode,
      campaignId: params.campaignId,
      isDryRun: params.isDryRun
    }, token || undefined);

    if (!response.success) {
      const currentAttemptedCurrency = (params.currencyCode || config.gam.defaultCurrencyCode || 'USD').trim().toUpperCase();
      // Auto-heal currency mismatch: if trigger currency was rejected by GAM, query network's real currency and retry once
      if (
        (response.googleError?.includes('INVALID_LINE_ITEM_CURRENCY') || response.error?.includes('INVALID_LINE_ITEM_CURRENCY')) &&
        params.networkCode
      ) {
        try {
          console.warn(`[LineItemService] Currency '${currentAttemptedCurrency}' was rejected by GAM network ${params.networkCode}. Querying NetworkService for actual network currency...`);
          const net = await GoogleAdManagerNetworkService.getCurrentNetwork(params.networkCode, params.isDryRun);
          if (net?.currencyCode && net.currencyCode.toUpperCase() !== currentAttemptedCurrency) {
            console.log(`[LineItemService] Auto-healing: Retrying createLineItem with GAM network currency '${net.currencyCode}'...`);
            return await this.createLineItem({
              ...params,
              currencyCode: net.currencyCode.toUpperCase()
            });
          }
        } catch (healErr: any) {
          console.error('[LineItemService] Failed to auto-heal currency mismatch:', healErr.message);
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to create Line Item in Google Ad Manager.',
        googleError: response.googleError,
        suggestedAction: response.suggestedAction || 'Verify dates, targeted Ad Unit ID, lineItemType, and cost/unit settings.'
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
   * Searches for a Line Item by name and orderId in GAM
   */
  public static async findLineItemByName(
    name: string,
    orderId: string,
    networkCode?: string,
    campaignId?: string,
    isDryRun: boolean = false
  ): Promise<{ id: string; name: string } | null> {
    if (isDryRun) return null;
    const token = await GoogleAdManagerAuthService.getAccessToken();
    const cleanName = name.replace(/'/g, "\\'");

    const bodyXml = `
      <ns:getLineItemsByStatement>
        <ns:filterStatement>
          <ns:query>WHERE orderId = ${orderId} AND name = '${cleanName}' LIMIT 1</ns:query>
        </ns:filterStatement>
      </ns:getLineItemsByStatement>
    `;

    const response = await soapClient.execute({
      service: 'LineItemService',
      action: 'getLineItemsByStatement',
      bodyXml,
      networkCode,
      campaignId,
      isDryRun
    }, token || undefined);

    if (!response.success) return null;

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
}
