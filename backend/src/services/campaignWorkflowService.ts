import {
  Campaign,
  CreateCampaignInput,
  WorkflowStepResult,
  AdSize
} from '../types';
import {
  campaignRepo,
  advertiserRepo,
  adUnitRepo,
  orderRepo,
  lineItemRepo,
  creativeRepo,
  associationRepo,
  gptTagRepo,
  settingsRepo,
  clientRepo
} from '../repositories';
import {
  GoogleAdManagerCompanyService,
  GoogleAdManagerInventoryService,
  GoogleAdManagerOrderService,
  GoogleAdManagerLineItemService,
  GoogleAdManagerCreativeService,
  GoogleAdManagerAssociationService,
  GoogleAdManagerNetworkService,
  GoogleAdManagerUserService
} from '../integrations/google-ad-manager';
import {
  sanitizeName,
  generateAdUnitCode,
  generateAdUnitName,
  generateOrderName,
  generateLineItemName,
  generateCreativeName
} from '../utils/sanitizer';
import { generateGPTTags } from '../utils/gptGenerator';
import { validateBannerUrl, validateTargetUrl } from '../utils/assetValidator';
import { config } from '../config';
import { webhookService } from '../services/webhookService';
import { CmsSyncService } from './cmsSyncService';

export class CampaignWorkflowService {
  /**
   * Creates a new campaign record and triggers the automation workflow
   */
  public static async createAndRunCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const campaignId = `CMP-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const campaign: any = {
      id: campaignId,
      advertiserName: input.advertiserName.trim(),
      customName: input.customName?.trim() || undefined,
      // Note: advertiserId here is a LOCAL DB FK, do NOT set from input.advertiserId
      // which is a GAM company ID — it will be resolved during workflow execution
      networkCode: input.networkCode || undefined,
      // Store the GAM advertiser ID hint for the workflow to use (skip GAM lookup)
      gamAdvertiserId: input.advertiserId || undefined,
      bannerUrl: input.bannerUrl.trim(),
      targetUrl: input.targetUrl.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      sizes: input.sizes && input.sizes.length > 0 ? input.sizes : [{ width: 300, height: 250 }],
      position: input.position || config.defaults.primaryPosition,
      lineItemType: input.lineItemType || 'SPONSORSHIP',
      creativeType: input.creativeType || 'IMAGE',
      assetsMap: input.assetsMap || undefined,
      thirdPartySnippet: input.thirdPartySnippet || undefined,
      isSafeFrameCompatible: input.isSafeFrameCompatible !== false,
      cm360Url: input.cm360Url || undefined,
      customCode: input.customCode || undefined,
      nativeFields: input.nativeFields || undefined,
      status: 'DRAFT',
      currentStep: 'INITIALIZED',
      isDryRun: Boolean(input.isDryRun),
      createdBy: input.createdBy || undefined,
      creatorEmail: input.creatorEmail || undefined,
      createdAt: now,
      updatedAt: now
    };

    campaignRepo.create(campaign);

    // Run workflow asynchronously
    this.executeWorkflow(campaign.id).catch(err => {
      console.error(`Workflow execution error for campaign ${campaign.id}:`, err);
    });

    return campaignRepo.findById(campaign.id) || campaign;
  }

  /**
   * Retries execution of a failed or paused campaign
   */
  public static async retryCampaign(campaignId: string): Promise<Campaign | null> {
    const campaign = campaignRepo.findById(campaignId);
    if (!campaign) return null;

    campaignRepo.updateStatus(campaignId, 'VALIDATING', 'RETRYING', null, null, null);
    
    this.executeWorkflow(campaignId).catch(err => {
      console.error(`Retry execution error for campaign ${campaignId}:`, err);
    });

    return campaignRepo.findById(campaignId);
  }

  /**
   * Main Saga Execution Engine for Google Ad Manager ad placement
   */
  public static async executeWorkflow(campaignId: string): Promise<WorkflowStepResult> {
    const campaign = campaignRepo.findById(campaignId);
    if (!campaign) {
      return { step: 'LOOKUP', success: false, error: 'Campaign not found.' };
    }

    const isDryRun = campaign.isDryRun;
    const settings = settingsRepo.get() || {};
    // Use networkCode from campaign (selected in UI) > settings > config default
    const networkCode = (campaign as any).networkCode || settings.networkCode || config.gam.networkCode;
    const timeZone = settings.timeZone || config.gam.defaultTimeZone;

    try {
      // -------------------------------------------------------------
      // Step 1: VALIDATING
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'VALIDATING', 'Validating campaign inputs and image asset...');

      if (!campaign.advertiserName || campaign.advertiserName.length > 255) {
        throw new Error('Advertiser Name is required and must be 255 characters or fewer.');
      }

      const targetCheck = validateTargetUrl(campaign.targetUrl);
      if (!targetCheck.isValid) {
        throw new Error(`Invalid Target URL: ${targetCheck.error}`);
      }

      const startDateObj = new Date(campaign.startDate);
      const endDateObj = new Date(campaign.endDate);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Start Date and End Date must be valid dates.');
      }
      if (endDateObj <= startDateObj) {
        throw new Error('End Date must be strictly greater than Start Date.');
      }

      // Validate banner image accessibility & size for the first size or all sizes
      const primarySize = campaign.sizes[0] || { width: 300, height: 250 };
      const bannerCheck = await validateBannerUrl(campaign.bannerUrl, primarySize.width, primarySize.height, isDryRun);
      if (!bannerCheck.isValid) {
        throw new Error(`Banner validation failed: ${bannerCheck.error}`);
      }

      // -------------------------------------------------------------
      // Step 2: ADVERTISER / COMPANY LOOKUP OR CREATION
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'CREATING_ADVERTISER', 'Searching or creating advertiser in Google Ad Manager...');

      let advertiser = advertiserRepo.findByName(campaign.advertiserName);
      let googleAdvertiserId = advertiser?.googleAdvertiserId;

      // If the user selected an existing GAM advertiser from the dropdown, use it directly
      const gamAdvertiserIdHint = (campaign as any).gamAdvertiserId;
      if (gamAdvertiserIdHint) {
        googleAdvertiserId = String(gamAdvertiserIdHint).replace(/^ADV-/, '').trim();
      }

      // If advertiser record has googleAdvertiserId or id starting with ADV-, strip prefix
      if (googleAdvertiserId) {
        googleAdvertiserId = String(googleAdvertiserId).replace(/^ADV-/, '').trim();
      } else if (advertiser && advertiser.id.startsWith('ADV-')) {
        const candidate = advertiser.id.replace(/^ADV-/, '').trim();
        if (/^\d+$/.test(candidate)) {
          googleAdvertiserId = candidate;
        }
      }

      if (!advertiser) {
        advertiser = advertiserRepo.create({
          id: `ADV-${Date.now().toString().slice(-6)}`,
          name: campaign.advertiserName,
          googleAdvertiserId: googleAdvertiserId || undefined,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else if (googleAdvertiserId && !advertiser.googleAdvertiserId) {
        advertiserRepo.updateGoogleId(advertiser.id, googleAdvertiserId);
      }
      campaignRepo.updateAdvertiserId(campaignId, advertiser.id);

      if (!googleAdvertiserId) {
        // Search GAM for existing advertiser company by name
        const existingGamAdvertiser = await GoogleAdManagerCompanyService.findAdvertiserByName(
          campaign.advertiserName,
          networkCode,
          campaignId,
          isDryRun
        );

        if (existingGamAdvertiser) {
          googleAdvertiserId = existingGamAdvertiser.id;
        } else {
          // Create new advertiser in GAM
          const createResult = await GoogleAdManagerCompanyService.createAdvertiser(
            campaign.advertiserName,
            networkCode,
            campaignId,
            isDryRun
          );
          if (!createResult.success || !createResult.id) {
            campaignRepo.updateStatus(
              campaignId,
              'FAILED',
              'CREATING_ADVERTISER',
              createResult.error,
              createResult.googleError,
              createResult.suggestedAction
            );
            return {
              step: 'CREATING_ADVERTISER',
              success: false,
              error: createResult.error,
              googleError: createResult.googleError,
              suggestedAction: createResult.suggestedAction
            };
          }
          googleAdvertiserId = createResult.id;
        }

        advertiserRepo.updateGoogleId(advertiser.id, googleAdvertiserId);
      }

      campaignRepo.updateStatus(campaignId, 'ADVERTISER_READY', 'Advertiser verified in Google Ad Manager.');

      // -------------------------------------------------------------
      // Step 3: AD UNIT LOOKUP OR CREATION & GPT TAG GENERATION
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'CREATING_AD_UNIT', 'Configuring Ad Units and generating GPT tags...');

      // Use customName if supplied, otherwise fallback to settings prefix or advertiserName
      const namingBase = (campaign as any).customName || campaign.advertiserName;
      const websitePrefix = (campaign as any).customName || settings.namingPrefix || config.defaults.websitePrefix;
      const position = campaign.position || config.defaults.primaryPosition;
      const createdAdUnits: { adUnit: any; googleId: string; size: AdSize }[] = [];

      for (const size of campaign.sizes) {
        const adUnitCode = generateAdUnitCode(websitePrefix, position, size.width, size.height);
        const adUnitName = generateAdUnitName(websitePrefix, position, size.width, size.height);

        let adUnit = adUnitRepo.findByCode(adUnitCode);
        let googleAdUnitId = adUnit?.googleAdUnitId;

        if (!adUnit) {
          adUnit = adUnitRepo.create({
            id: `ADU-${Date.now().toString().slice(-6)}-${size.width}x${size.height}`,
            name: adUnitName,
            code: adUnitCode,
            sizes: [size],
            networkCode: networkCode || null,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else if (!adUnit.networkCode && networkCode) {
          adUnitRepo.updateNetworkCode(adUnit.id, networkCode);
          adUnit.networkCode = networkCode;
        }

        // Always look up ad unit in GAM fresh (per network) — do not rely on cached DB ID
        // which may belong to a different network
        const existingGamAdUnit = await GoogleAdManagerInventoryService.findAdUnitByCode(
          adUnitCode,
          networkCode,
          campaignId,
          isDryRun
        );

        if (existingGamAdUnit) {
          googleAdUnitId = existingGamAdUnit.id;
          adUnitRepo.updateGoogleId(adUnit.id, googleAdUnitId);
        } else {
          // GAM requires parentId (root ad unit) for all child Ad Unit creation
          const rootAdUnitId = await GoogleAdManagerInventoryService.getRootAdUnitId(networkCode, isDryRun);
          if (!rootAdUnitId && !isDryRun) {
            campaignRepo.updateStatus(campaignId, 'FAILED', 'CREATING_AD_UNIT',
              'Could not find root Ad Unit for this GAM network. Ensure the service account has InventoryService access.',
              null, 'Check service account permissions in GAM Admin → Access & authorization.'
            );
            return { step: 'CREATING_AD_UNIT', success: false, error: 'Root Ad Unit not found.' };
          }

          const createAdUnitRes = await GoogleAdManagerInventoryService.createAdUnit(
            adUnitName,
            adUnitCode,
            [size],
            rootAdUnitId || undefined,
            networkCode,
            campaignId,
            isDryRun
          );

          if (!createAdUnitRes.success || !createAdUnitRes.id) {
            campaignRepo.updateStatus(
              campaignId,
              'FAILED',
              'CREATING_AD_UNIT',
              createAdUnitRes.error,
              createAdUnitRes.googleError,
              createAdUnitRes.suggestedAction
            );
            return {
              step: 'CREATING_AD_UNIT',
              success: false,
              error: createAdUnitRes.error,
              googleError: createAdUnitRes.googleError,
              suggestedAction: createAdUnitRes.suggestedAction
            };
          }
          googleAdUnitId = createAdUnitRes.id;
          adUnitRepo.updateGoogleId(adUnit.id, googleAdUnitId);
        }

        createdAdUnits.push({ adUnit, googleId: googleAdUnitId, size });

        // Generate and save GPT Tag for this ad unit & size
        const gptTags = generateGPTTags(networkCode, adUnitCode, size);
        gptTagRepo.create({
          id: `GPT-${Date.now().toString().slice(-6)}-${size.width}x${size.height}`,
          campaignId,
          adUnitId: adUnit.id,
          size,
          divId: gptTags.divId,
          headCode: gptTags.headCode,
          bodyCode: gptTags.bodyCode,
          completeCode: gptTags.completeCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      campaignRepo.updateStatus(campaignId, 'AD_UNIT_CREATED', 'Ad Units & GPT tags generated.');

      // -------------------------------------------------------------
      // Step 4: ORDER CREATION
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'CREATING_ORDER', 'Creating Order in Google Ad Manager...');

      const orderName = generateOrderName(namingBase, campaign.startDate);
      let order = orderRepo.findByCampaignId(campaignId);
      let googleOrderId = order?.googleOrderId;


      if (!order) {
        order = orderRepo.create({
          id: `ORD-${Date.now().toString().slice(-6)}`,
          campaignId,
          name: orderName,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (!googleOrderId) {
        // First, check if the Order already exists in GAM for this advertiser/date
        const existingGamOrder = await GoogleAdManagerOrderService.findOrderByName(
          orderName,
          networkCode,
          campaignId,
          isDryRun
        );

        if (existingGamOrder) {
          googleOrderId = existingGamOrder.id;
          orderRepo.updateGoogleId(order.id, googleOrderId);
        } else {
          // GAM requires a traffickerId — fetch the current user dynamically
          const gamUser = await GoogleAdManagerUserService.getCurrentUser(networkCode, isDryRun);
          if (!gamUser && !isDryRun) {
            const errMsg = 'Could not retrieve current GAM user ID (traffickerId is required for Order creation). Ensure the service account is added as a user in this GAM network.';
            campaignRepo.updateStatus(campaignId, 'FAILED', 'CREATING_ORDER', errMsg, null, 'Go to Admin → Access & authorization → Users in your GAM network and add the service account email with a Trafficker or Administrator role.');
            return { step: 'CREATING_ORDER', success: false, error: errMsg };
          }
          const traffickerId = gamUser?.id || '0';

          let createOrderRes = await GoogleAdManagerOrderService.createOrder(
            orderName,
            googleAdvertiserId,
            traffickerId,
            networkCode,
            campaignId,
            isDryRun
          );

          // If unique name conflict occurs, append unique timestamp suffix
          if (!createOrderRes.success && (createOrderRes.googleError?.includes('NOT_UNIQUE') || createOrderRes.error?.includes('NOT_UNIQUE'))) {
            const uniqueOrderName = `${orderName}_${Date.now().toString().slice(-4)}`;
            createOrderRes = await GoogleAdManagerOrderService.createOrder(
              uniqueOrderName,
              googleAdvertiserId,
              traffickerId,
              networkCode,
              campaignId,
              isDryRun
            );
          }

          if (!createOrderRes.success || !createOrderRes.id) {
            campaignRepo.updateStatus(
              campaignId,
              'FAILED',
              'CREATING_ORDER',
              createOrderRes.error,
              createOrderRes.googleError,
              createOrderRes.suggestedAction
            );
            return {
              step: 'CREATING_ORDER',
              success: false,
              error: createOrderRes.error,
              googleError: createOrderRes.googleError,
              suggestedAction: createOrderRes.suggestedAction
            };
          }
          googleOrderId = createOrderRes.id;
          orderRepo.updateGoogleId(order.id, googleOrderId);
        }
      }

      campaignRepo.updateStatus(campaignId, 'ORDER_CREATED', 'Order created in Google Ad Manager.');

      // -------------------------------------------------------------
      // Step 5: LINE ITEM CREATION
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'CREATING_LINE_ITEM', 'Creating Line Items in Google Ad Manager...');

      // Dynamically resolve currency code for this specific network / client account
      let effectiveCurrency: string | undefined = undefined;
      if (networkCode) {
        const client = clientRepo.findByNetworkCode(networkCode);
        if (client?.currencyCode) {
          effectiveCurrency = client.currencyCode;
        }
      }
      if (!effectiveCurrency) {
        effectiveCurrency = settings.currencyCode || config.gam.defaultCurrencyCode || 'USD';
      }

      const createdLineItems: { lineItem: any; googleId: string; size: AdSize }[] = [];
      const existingLineItems = lineItemRepo.findByCampaignId(campaignId);

      for (const item of createdAdUnits) {
        const size = item.size;
        const lineItemName = generateLineItemName(namingBase, position, size.width, size.height);

        let lineItem = existingLineItems.find(li => li.size.width === size.width && li.size.height === size.height);
        let googleLineItemId = lineItem?.googleLineItemId;

        const effectiveLineItemType = ((campaign as any).lineItemType || settings.defaultLineItemType || config.defaults.lineItemType || 'SPONSORSHIP') as any;
        const effectivePriority = effectiveLineItemType === 'SPONSORSHIP' ? 4 : (effectiveLineItemType === 'STANDARD' ? 8 : (settings.defaultPriority || 4));

        if (!lineItem) {
          lineItem = lineItemRepo.create({
            id: `LIN-${Date.now().toString().slice(-6)}-${size.width}x${size.height}`,
            campaignId,
            orderId: order.id,
            name: lineItemName,
            size,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            lineItemType: effectiveLineItemType,
            costType: settings.defaultCostType || config.defaults.costType || 'CPM',
            priority: effectivePriority,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        if (!googleLineItemId) {
          // Check if line item already exists in GAM for this order
          const existingGamLineItem = await GoogleAdManagerLineItemService.findLineItemByName(
            lineItemName,
            googleOrderId,
            networkCode,
            campaignId,
            isDryRun
          );

          if (existingGamLineItem) {
            googleLineItemId = existingGamLineItem.id;
            lineItemRepo.updateGoogleId(lineItem.id, googleLineItemId);
          } else {
            let createLineItemRes = await GoogleAdManagerLineItemService.createLineItem({
              orderId: googleOrderId,
              name: lineItemName,
              size,
              googleAdUnitId: item.googleId,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
              lineItemType: effectiveLineItemType,
              priority: effectivePriority,
              costType: lineItem.costType,
              timeZoneId: timeZone,
              currencyCode: effectiveCurrency,
              networkCode,
              campaignId,
              isDryRun
            });

            // If unique name collision, retry with timestamp suffix
            if (!createLineItemRes.success && (createLineItemRes.googleError?.includes('NOT_UNIQUE') || createLineItemRes.error?.includes('NOT_UNIQUE'))) {
              const uniqueLineItemName = `${lineItemName}_${Date.now().toString().slice(-4)}`;
              createLineItemRes = await GoogleAdManagerLineItemService.createLineItem({
                orderId: googleOrderId,
                name: uniqueLineItemName,
                size,
                googleAdUnitId: item.googleId,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                lineItemType: effectiveLineItemType,
                priority: effectivePriority,
                costType: lineItem.costType,
                timeZoneId: timeZone,
                currencyCode: effectiveCurrency,
                networkCode,
                campaignId,
                isDryRun
              });
            }

            if (!createLineItemRes.success || !createLineItemRes.id) {
              campaignRepo.updateStatus(
                campaignId,
                'FAILED',
                'CREATING_LINE_ITEM',
                createLineItemRes.error,
                createLineItemRes.googleError,
                createLineItemRes.suggestedAction
              );
              return {
                step: 'CREATING_LINE_ITEM',
                success: false,
                error: createLineItemRes.error,
                googleError: createLineItemRes.googleError,
                suggestedAction: createLineItemRes.suggestedAction
              };
            }
            googleLineItemId = createLineItemRes.id;
            lineItemRepo.updateGoogleId(lineItem.id, googleLineItemId);
          }
        }

        createdLineItems.push({ lineItem, googleId: googleLineItemId, size });
      }

      campaignRepo.updateStatus(campaignId, 'LINE_ITEM_CREATED', 'Line Items created.');

      // -------------------------------------------------------------
      // Step 6: CREATIVE CREATION
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'CREATING_CREATIVE', 'Creating Creatives in Google Ad Manager...');

      const createdCreatives: { creative: any; googleId: string; size: AdSize; lineItemId: string; googleLineItemId: string }[] = [];
      const existingCreatives = creativeRepo.findByCampaignId(campaignId);

      for (const item of createdLineItems) {
        const size = item.size;
        const creativeName = generateCreativeName(namingBase, size.width, size.height);

        let creative = existingCreatives.find(cr => cr.width === size.width && cr.height === size.height);
        let googleCreativeId = creative?.googleCreativeId;

        // Size-specific asset from assetsMap if present, fallback to campaign.bannerUrl
        const sizeKey = `${size.width}x${size.height}`;
        const sizeBannerUrl = (campaign as any).assetsMap?.[sizeKey] || campaign.bannerUrl;

        if (!creative) {
          creative = creativeRepo.create({
            id: `CRE-${Date.now().toString().slice(-6)}-${size.width}x${size.height}`,
            campaignId,
            lineItemId: item.lineItem.id,
            name: creativeName,
            bannerUrl: sizeBannerUrl,
            targetUrl: campaign.targetUrl,
            width: size.width,
            height: size.height,
            creativeType: (campaign as any).creativeType || 'IMAGE',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        if (!googleCreativeId) {
          // Check if creative already exists in GAM under this advertiser
          const existingGamCreative = await GoogleAdManagerCreativeService.findCreativeByName(
            creativeName,
            googleAdvertiserId,
            networkCode,
            campaignId,
            isDryRun
          );

          if (existingGamCreative) {
            googleCreativeId = existingGamCreative.id;
            creativeRepo.updateGoogleId(creative.id, googleCreativeId);
          } else {
            let createCreativeRes = await GoogleAdManagerCreativeService.createCreative({
              advertiserId: googleAdvertiserId,
              name: creativeName,
              bannerUrl: sizeBannerUrl,
              targetUrl: campaign.targetUrl,
              size,
              creativeType: (campaign as any).creativeType || 'IMAGE',
              thirdPartySnippet: (campaign as any).thirdPartySnippet,
              isSafeFrameCompatible: (campaign as any).isSafeFrameCompatible,
              cm360Url: (campaign as any).cm360Url,
              customCode: (campaign as any).customCode,
              nativeFields: (campaign as any).nativeFields,
              networkCode,
              campaignId,
              isDryRun
            });

            // If unique name collision, retry with timestamp suffix
            if (!createCreativeRes.success && (createCreativeRes.googleError?.includes('NOT_UNIQUE') || createCreativeRes.error?.includes('NOT_UNIQUE'))) {
              const uniqueCreativeName = `${creativeName}_${Date.now().toString().slice(-4)}`;
              createCreativeRes = await GoogleAdManagerCreativeService.createCreative({
                advertiserId: googleAdvertiserId,
                name: uniqueCreativeName,
                bannerUrl: sizeBannerUrl,
                targetUrl: campaign.targetUrl,
                size,
                creativeType: (campaign as any).creativeType || 'IMAGE',
                thirdPartySnippet: (campaign as any).thirdPartySnippet,
                isSafeFrameCompatible: (campaign as any).isSafeFrameCompatible,
                cm360Url: (campaign as any).cm360Url,
                customCode: (campaign as any).customCode,
                nativeFields: (campaign as any).nativeFields,
                networkCode,
                campaignId,
                isDryRun
              });
            }

            if (!createCreativeRes.success || !createCreativeRes.id) {
              campaignRepo.updateStatus(
                campaignId,
                'FAILED',
                'CREATING_CREATIVE',
                createCreativeRes.error,
                createCreativeRes.googleError,
                createCreativeRes.suggestedAction
              );
              return {
                step: 'CREATING_CREATIVE',
                success: false,
                error: createCreativeRes.error,
                googleError: createCreativeRes.googleError,
                suggestedAction: createCreativeRes.suggestedAction
              };
            }
            googleCreativeId = createCreativeRes.id;
            creativeRepo.updateGoogleId(creative.id, googleCreativeId);
          }
        }

        createdCreatives.push({
          creative,
          googleId: googleCreativeId,
          size,
          lineItemId: item.lineItem.id,
          googleLineItemId: item.googleId
        });
      }

      campaignRepo.updateStatus(campaignId, 'CREATIVE_CREATED', 'Creatives created.');

      // -------------------------------------------------------------
      // Step 7: LINE ITEM / CREATIVE ASSOCIATION (LICA)
      // -------------------------------------------------------------
      campaignRepo.updateStatus(campaignId, 'ASSOCIATING_CREATIVE', 'Associating Creatives with Line Items...');

      for (const item of createdCreatives) {
        let assoc = associationRepo.findByLineItemId(item.lineItemId);
        let googleAssociationId = assoc?.googleAssociationId;

        if (!assoc) {
          assoc = associationRepo.create({
            id: `LICA-${Date.now().toString().slice(-6)}-${item.size.width}x${item.size.height}-${Math.floor(Math.random() * 1000)}`,
            lineItemId: item.lineItemId,
            creativeId: item.creative.id,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          });
        }

        if (!googleAssociationId) {
          // Check if association already exists in GAM
          const existingGamAssoc = await GoogleAdManagerAssociationService.findAssociation(
            item.googleLineItemId,
            item.googleId,
            networkCode,
            campaignId,
            isDryRun
          );

          if (existingGamAssoc) {
            googleAssociationId = existingGamAssoc.id;
            associationRepo.updateGoogleId(assoc.id, googleAssociationId);
          } else {
            const assocRes = await GoogleAdManagerAssociationService.associateCreativeWithLineItem(
              item.googleLineItemId,
              item.googleId,
              networkCode,
              campaignId,
              isDryRun
            );

            if (!assocRes.success) {
              // If it already exists in GAM, treat as success
              if (
                assocRes.googleError?.includes('ALREADY_EXISTS') ||
                assocRes.error?.includes('ALREADY_EXISTS')
              ) {
                googleAssociationId = `${item.googleLineItemId}_${item.googleId}`;
                associationRepo.updateGoogleId(assoc.id, googleAssociationId);
              } else {
                campaignRepo.updateStatus(
                  campaignId,
                  'FAILED',
                  'ASSOCIATING_CREATIVE',
                  assocRes.error,
                  assocRes.googleError,
                  assocRes.suggestedAction
                );
                return {
                  step: 'ASSOCIATING_CREATIVE',
                  success: false,
                  error: assocRes.error,
                  googleError: assocRes.googleError,
                  suggestedAction: assocRes.suggestedAction
                };
              }
            } else {
              googleAssociationId = assocRes.id || `${item.googleLineItemId}_${item.googleId}`;
              associationRepo.updateGoogleId(assoc.id, googleAssociationId);
            }
          }
        }
      }

      // -------------------------------------------------------------
      // Step 8: AUTO-APPROVE ORDER & MARK READY
      // -------------------------------------------------------------
      if (googleOrderId && !isDryRun) {
        try {
          await GoogleAdManagerOrderService.approveOrder(
            googleOrderId,
            networkCode,
            campaignId,
            isDryRun
          );
        } catch (approvalErr) {
          console.warn('Order auto-approval warning:', approvalErr);
        }
      }

      campaignRepo.updateStatus(campaignId, 'READY', 'COMPLETED', null, null, null);

      // Trigger Webhook Notification on Campaign Launch
      try {
        webhookService.notify({
          event: 'CAMPAIGN_CREATED',
          campaignId,
          advertiserName: campaign.advertiserName,
          networkCode,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          sizes: campaign.sizes.map(s => `${s.width}x${s.height}`),
          message: `Campaign for ${campaign.advertiserName} booked and approved in Google Ad Manager (${networkCode})!`,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('Webhook notification error:', err));
      } catch (notifyErr) {
        console.warn('Webhook notification error:', notifyErr);
      }

      // Automatically push GPT tags to active CMS partners
      try {
        CmsSyncService.syncCampaign(campaignId).catch(err => {
          console.warn('CMS auto-sync background error:', err);
        });
      } catch (cmsErr) {
        console.warn('Failed to trigger CMS sync:', cmsErr);
      }

      return {
        step: 'COMPLETED',
        success: true,
        data: {
          campaignId,
          status: 'READY',
          googleAdvertiserId,
          googleOrderId,
          lineItems: createdLineItems.map(l => ({ size: l.size, googleId: l.googleId })),
          creatives: createdCreatives.map(c => ({ size: c.size, googleId: c.googleId })),
          adUnits: createdAdUnits.map(a => ({ size: a.size, googleId: a.googleId }))
        }
      };

    } catch (err: any) {
      campaignRepo.updateStatus(
        campaignId,
        'FAILED',
        'VALIDATING',
        err.message || 'Workflow execution error.',
        null,
        'Check campaign form inputs and network configuration.'
      );

      // Trigger Webhook Notification on Failure
      try {
        webhookService.notify({
          event: 'CAMPAIGN_FAILED',
          campaignId,
          advertiserName: campaign?.advertiserName || 'Unknown',
          networkCode: networkCode || '22068249324',
          message: `Campaign ${campaignId} failed during execution: ${err.message}`,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('Failure webhook error:', err));
      } catch (notifyErr) {
        console.warn('Failure webhook error:', notifyErr);
      }

      return {
        step: 'FAILED',
        success: false,
        error: err.message
      };
    }
  }
}
