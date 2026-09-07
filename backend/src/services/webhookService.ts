import axios from 'axios';
import { settingsRepo, logRepo } from '../repositories';

export interface WebhookPayload {
  event: 'CAMPAIGN_CREATED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_RESUMED' | 'CAMPAIGN_FAILED' | 'BANNER_UPDATED' | 'TEST_NOTIFICATION';
  campaignId?: string;
  advertiserName?: string;
  networkCode?: string;
  startDate?: string;
  endDate?: string;
  sizes?: string[];
  message: string;
  timestamp: string;
}

export const webhookService = {
  /**
   * Send notification to configured Slack webhook and/or custom Email/Webhook URL
   */
  async notify(payload: WebhookPayload): Promise<{ slackSent: boolean; emailWebhookSent: boolean }> {
    const settings = settingsRepo.get() || {};
    const slackUrl = settings.slackWebhookUrl;
    const emailWebhookUrl = settings.emailWebhookUrl;
    const enabled = settings.webhooksEnabled !== false;

    if (!enabled) {
      return { slackSent: false, emailWebhookSent: false };
    }

    let slackSent = false;
    let emailWebhookSent = false;

    // 1. Send to Slack Webhook
    if (slackUrl && slackUrl.trim().startsWith('http')) {
      try {
        const emoji = payload.event === 'CAMPAIGN_CREATED' ? '🚀' :
                      payload.event === 'CAMPAIGN_FAILED' ? '🚨' :
                      payload.event === 'BANNER_UPDATED' ? '🎨' : '📢';

        const slackBody = {
          text: `${emoji} *[Blink CMS Alert]*: ${payload.message}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emoji} Blink CMS: ${payload.event.replace('_', ' ')}`,
                emoji: true
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:* ${payload.message}\n*Advertiser:* ${payload.advertiserName || 'N/A'}\n*Network:* \`${payload.networkCode || '22068249324'}\`\n*Campaign ID:* \`${payload.campaignId || 'N/A'}\``
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `⏱ *Time:* ${new Date(payload.timestamp).toLocaleString()} | *Platform:* Blink CMS GAM Engine`
                }
              ]
            }
          ]
        };

        await axios.post(slackUrl.trim(), slackBody, { timeout: 6000 });
        slackSent = true;
      } catch (err: any) {
        console.warn('Slack webhook delivery failed:', err.message);
      }
    }

    // 2. Send to Email / Generic Webhook URL
    if (emailWebhookUrl && emailWebhookUrl.trim().startsWith('http')) {
      try {
        await axios.post(emailWebhookUrl.trim(), payload, { timeout: 6000 });
        emailWebhookSent = true;
      } catch (err: any) {
        console.warn('Email/Generic webhook delivery failed:', err.message);
      }
    }

    return { slackSent, emailWebhookSent };
  }
};
