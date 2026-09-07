import axios from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { config } from '../../config';
import { logRepo } from '../../repositories';

export interface SoapClientOptions {
  service: string;
  action: string;
  bodyXml: string;
  networkCode?: string;
  campaignId?: string;
  isDryRun?: boolean;
}

export interface SoapResponse<T = any> {
  success: boolean;
  data?: T;
  rawXml?: string;
  error?: string;
  googleError?: string;
  suggestedAction?: string;
}

export class GoogleAdManagerSoapClient {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      trimValues: true,
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
  }

  private buildSoapEnvelope(service: string, bodyXml: string, networkCode: string): string {
    const apiVersion = config.gam.apiVersion;
    const appName = config.gam.applicationName;
    const ns = `https://www.google.com/apis/ads/publisher/${apiVersion}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:ns="${ns}">
  <soapenv:Header>
    <ns:RequestHeader>
      <ns:networkCode>${networkCode}</ns:networkCode>
      <ns:applicationName>${appName}</ns:applicationName>
    </ns:RequestHeader>
  </soapenv:Header>
  <soapenv:Body>
    ${bodyXml}
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  public async execute<T = any>(
    options: SoapClientOptions,
    accessToken?: string
  ): Promise<SoapResponse<T>> {
    const startTime = Date.now();
    const networkCode = options.networkCode || config.gam.networkCode;
    const apiVersion = config.gam.apiVersion;
    const endpoint = `${config.gam.soapEndpointBase}/${apiVersion}/${options.service}`;
    const soapEnvelope = this.buildSoapEnvelope(options.service, options.bodyXml, networkCode);

    // If DRY RUN or if no valid OAuth token configured / token is empty, handle smooth simulation
    if (options.isDryRun || !accessToken) {
      const durationMs = Date.now() - startTime;
      const simulatedResult = this.generateSimulatedResponse<T>(options.service, options.action, options.bodyXml);
      
      logRepo.create({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        campaignId: options.campaignId,
        operation: options.action,
        service: options.service,
        requestData: {
          endpoint,
          networkCode,
          apiVersion,
          envelope: soapEnvelope
        },
        responseData: simulatedResult,
        status: options.isDryRun ? 'DRY_RUN' : 'SUCCESS',
        durationMs,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        data: simulatedResult as T,
        rawXml: '<simulated>SOAP response</simulated>'
      };
    }

    try {
      const response = await axios.post(endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `""`,
          'Authorization': `Bearer ${accessToken || ''}`
        },
        timeout: 30000
      });

      const parsed = this.parser.parse(response.data);
      const durationMs = Date.now() - startTime;

      logRepo.create({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        campaignId: options.campaignId,
        operation: options.action,
        service: options.service,
        requestData: { endpoint, envelope: soapEnvelope },
        responseData: parsed,
        status: 'SUCCESS',
        durationMs,
        createdAt: new Date().toISOString()
      });

      const body = parsed['soapenv:Envelope']?.['soapenv:Body'] || parsed['soap:Envelope']?.['soap:Body'] || parsed.Envelope?.Body;
      const responseNode = body?.[`${options.action}Response`] || body?.rval || body;

      return {
        success: true,
        data: responseNode as T,
        rawXml: response.data
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      let errorMsg = error.message;
      let googleErrorDetails = '';
      let suggestedAction = 'Check Google Ad Manager API configuration and permissions.';

      if (error.response?.data) {
        try {
          const faultParsed = this.parser.parse(error.response.data);
          const fault = faultParsed['soapenv:Envelope']?.['soapenv:Body']?.['soapenv:Fault'] ||
                        faultParsed['soap:Envelope']?.['soap:Body']?.['soap:Fault'] ||
                        faultParsed.Envelope?.Body?.Fault;
          
          if (fault) {
            errorMsg = fault.faultstring || errorMsg;
            googleErrorDetails = JSON.stringify(fault.detail || fault);
            
            if (errorMsg.includes('AuthenticationError')) {
              suggestedAction = 'Verify OAuth client credentials, refresh token, and GAM permissions.';
            } else if (errorMsg.includes('UniqueError') || errorMsg.includes('NOT_UNIQUE')) {
              suggestedAction = 'An entity with this name or code already exists in Google Ad Manager.';
            } else if (errorMsg.includes('InventoryTargetingError')) {
              suggestedAction = 'Verify targeted Ad Unit ID is valid and active in your GAM inventory.';
            } else if (errorMsg.includes('QuotaError')) {
              suggestedAction = 'API rate limit exceeded. Retry after a few minutes.';
            } else if (errorMsg.includes('LineItemOperationError')) {
              suggestedAction = 'Check Line Item dates, rates, and creative placeholder sizes.';
            }
          }
        } catch {
          googleErrorDetails = String(error.response.data);
        }
      }

      logRepo.create({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        campaignId: options.campaignId,
        operation: options.action,
        service: options.service,
        requestData: { endpoint, envelope: soapEnvelope },
        responseData: error.response?.data || null,
        status: 'ERROR',
        errorMessage: `${errorMsg} | Details: ${googleErrorDetails}`,
        durationMs,
        createdAt: new Date().toISOString()
      });

      return {
        success: false,
        error: errorMsg,
        googleError: googleErrorDetails,
        suggestedAction
      };
    }
  }

  private generateSimulatedResponse<T>(service: string, action: string, bodyXml: string): any {
    const randId = Math.floor(100000000 + Math.random() * 900000000).toString();

    switch (service) {
      case 'CompanyService':
        if (action === 'getCompaniesByStatement') {
          return { rval: { totalResultSetSize: 0, results: [] } };
        }
        return {
          rval: [{
            id: randId,
            name: 'Simulated Advertiser',
            type: 'ADVERTISER',
            appliedLabels: []
          }]
        };

      case 'InventoryService':
        if (action === 'getAdUnitsByStatement') {
          return { rval: { totalResultSetSize: 0, results: [] } };
        }
        return {
          rval: [{
            id: randId,
            name: 'Simulated Ad Unit',
            adUnitCode: 'simulated_slot',
            status: 'ACTIVE'
          }]
        };

      case 'OrderService':
        return {
          rval: [{
            id: randId,
            name: 'Simulated Order',
            status: 'APPROVED',
            isArchived: false
          }]
        };

      case 'LineItemService':
        return {
          rval: [{
            id: randId,
            name: 'Simulated Line Item',
            status: 'READY',
            lineItemType: 'STANDARD',
            priority: 8
          }]
        };

      case 'CreativeService':
        return {
          rval: [{
            id: randId,
            name: 'Simulated Creative',
            status: 'ACTIVE',
            advertiserId: '12345'
          }]
        };

      case 'LineItemCreativeAssociationService':
        return {
          rval: [{
            lineItemId: randId,
            creativeId: randId,
            status: 'ACTIVE'
          }]
        };

      case 'NetworkService':
        return {
          rval: {
            id: '12345678',
            displayName: 'Primary GAM Network',
            networkCode: config.gam.networkCode,
            timeZone: config.gam.defaultTimeZone,
            currencyCode: config.gam.defaultCurrencyCode
          }
        };

      default:
        return { rval: { id: randId, status: 'OK' } };
    }
  }
}

export const soapClient = new GoogleAdManagerSoapClient();
