import { Request, Response } from 'express';
import { GoogleAdManagerAuthService } from '../integrations/google-ad-manager/authService';
import { soapClient } from '../integrations/google-ad-manager/soapClient';
import { settingsRepo } from '../repositories';
import { config } from '../config';

export const testConnectionController = async (req: Request, res: Response) => {
  try {
    const settings = settingsRepo.get() || {};
    const networkCode = req.body.networkCode || settings.networkCode || config.gam.networkCode;
    const serviceAccount = GoogleAdManagerAuthService.getServiceAccount();

    if (!serviceAccount && !settings.googleRefreshToken) {
      return res.status(200).json({
        success: false,
        error: 'No Service Account key or OAuth credentials found.',
        suggestedAction: 'Please upload your Google Cloud Service Account JSON key in the settings panel below, paste the JSON key, or configure GOOGLE_APPLICATION_CREDENTIALS.'
      });
    }

    const token = await GoogleAdManagerAuthService.getAccessToken();
    if (!token) {
      return res.status(200).json({
        success: false,
        error: 'Failed to generate OAuth2 Access Token from Service Account.',
        suggestedAction: 'Verify that your Service Account key contains a valid "private_key" and "client_email", and that your system clock is accurate.'
      });
    }

    // Attempt getCurrentNetwork SOAP call
    const bodyXml = `<ns:getCurrentNetwork xmlns:ns="https://www.google.com/apis/ads/publisher/v202511"/>`;
    const soapRes = await soapClient.execute({
      service: 'NetworkService',
      action: 'getCurrentNetwork',
      bodyXml,
      networkCode
    }, token);

    if (soapRes.success && soapRes.data) {
      const rval = soapRes.data.rval || soapRes.data;
      return res.json({
        success: true,
        message: 'Successfully connected to Google Ad Manager Network!',
        network: {
          networkCode: rval.networkCode || networkCode,
          displayName: rval.displayName || 'Google Ad Manager Network',
          timeZone: rval.timeZone || 'America/New_York',
          currencyCode: rval.currencyCode || 'USD'
        }
      });
    } else {
      const saEmail = serviceAccount?.client_email || 'your Service Account';
      return res.status(200).json({
        success: false,
        error: soapRes.error || 'Failed to connect to GAM network.',
        googleError: soapRes.googleError,
        suggestedAction: soapRes.suggestedAction || `Ensure ${saEmail} is added as a user in GAM Admin > Access & authorization > Users, with Trafficker or Administrator role, and API Access is enabled in GAM Network Settings.`
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
