import crypto from 'crypto';
import { db } from '../database/db';
import {
  Advertiser,
  AdUnit,
  Campaign,
  Order,
  LineItem,
  Creative,
  CreativeAssociation,
  GptTag,
  ApiLog,
  AdSize,
  User,
  UserRecord
} from '../types';

export const userRepo = {
  findByEmail(email: string): UserRecord | null {
    const row: any = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      role: row.role,
      avatar: row.avatar,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findById(id: string): User | null {
    const row: any = db.prepare('SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(data: { name: string; email: string; password: string; role?: User['role']; avatar?: string }): User {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(data.password, salt, 64).toString('hex');
    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const role = data.role || 'trafficker';
    const avatar = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`;

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name.trim(),
      data.email.trim().toLowerCase(),
      passwordHash,
      salt,
      role,
      avatar,
      now,
      now
    );

    return {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role,
      avatar,
      createdAt: now,
      updatedAt: now
    };
  },

  verifyPassword(userRecord: UserRecord, passwordAttempt: string): boolean {
    const hashAttempt = crypto.scryptSync(passwordAttempt, userRecord.salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(userRecord.passwordHash, 'hex'), Buffer.from(hashAttempt, 'hex'));
  },

  list(): User[] {
    const rows: any[] = db.prepare('SELECT id, name, email, role, avatar, created_at, updated_at FROM users ORDER BY created_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatar: r.avatar,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }
};


export const advertiserRepo = {
  findByName(name: string): Advertiser | null {
    const row: any = db.prepare('SELECT * FROM advertisers WHERE LOWER(name) = LOWER(?)').get(name);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      googleAdvertiserId: row.google_advertiser_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findById(id: string): Advertiser | null {
    const row: any = db.prepare('SELECT * FROM advertisers WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      googleAdvertiserId: row.google_advertiser_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(advertiser: Advertiser): Advertiser {
    db.prepare(`
      INSERT INTO advertisers (id, name, google_advertiser_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      advertiser.id,
      advertiser.name,
      advertiser.googleAdvertiserId || null,
      advertiser.status,
      advertiser.createdAt,
      advertiser.updatedAt
    );
    return advertiser;
  },

  updateGoogleId(id: string, googleAdvertiserId: string): void {
    db.prepare('UPDATE advertisers SET google_advertiser_id = ?, updated_at = ? WHERE id = ?')
      .run(googleAdvertiserId, new Date().toISOString(), id);
  },

  list(): Advertiser[] {
    const rows: any[] = db.prepare('SELECT * FROM advertisers ORDER BY created_at DESC').all();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      googleAdvertiserId: row.google_advertiser_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM advertisers WHERE id = ?').run(id);
    return info.changes > 0;
  }
};

export const adUnitRepo = {
  findByCode(code: string): AdUnit | null {
    const row: any = db.prepare('SELECT * FROM ad_units WHERE LOWER(code) = LOWER(?)').get(code);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      googleAdUnitId: row.google_ad_unit_id,
      parentGoogleAdUnitId: row.parent_google_ad_unit_id,
      sizes: JSON.parse(row.sizes || '[]'),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findById(id: string): AdUnit | null {
    const row: any = db.prepare('SELECT * FROM ad_units WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      googleAdUnitId: row.google_ad_unit_id,
      parentGoogleAdUnitId: row.parent_google_ad_unit_id,
      sizes: JSON.parse(row.sizes || '[]'),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(adUnit: AdUnit): AdUnit {
    db.prepare(`
      INSERT INTO ad_units (id, name, code, google_ad_unit_id, parent_google_ad_unit_id, sizes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adUnit.id,
      adUnit.name,
      adUnit.code,
      adUnit.googleAdUnitId || null,
      adUnit.parentGoogleAdUnitId || null,
      JSON.stringify(adUnit.sizes),
      adUnit.status,
      adUnit.createdAt,
      adUnit.updatedAt
    );
    return adUnit;
  },

  updateGoogleId(id: string, googleAdUnitId: string): void {
    db.prepare('UPDATE ad_units SET google_ad_unit_id = ?, updated_at = ? WHERE id = ?')
      .run(googleAdUnitId, new Date().toISOString(), id);
  },

  list(): AdUnit[] {
    const rows: any[] = db.prepare('SELECT * FROM ad_units ORDER BY created_at DESC').all();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      googleAdUnitId: row.google_ad_unit_id,
      parentGoogleAdUnitId: row.parent_google_ad_unit_id,
      sizes: JSON.parse(row.sizes || '[]'),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM ad_units WHERE id = ?').run(id);
    return info.changes > 0;
  }
};

export const campaignRepo = {
  create(campaign: Campaign): Campaign {
    db.prepare(`
      INSERT INTO campaigns (
        id, advertiser_id, advertiser_name, banner_url, target_url,
        start_date, end_date, sizes, position, status, current_step,
        error_message, google_error_details, suggested_action, is_dry_run,
        network_code, gam_advertiser_id, custom_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      campaign.id,
      campaign.advertiserId || null,
      campaign.advertiserName,
      campaign.bannerUrl,
      campaign.targetUrl,
      campaign.startDate,
      campaign.endDate,
      JSON.stringify(campaign.sizes),
      campaign.position || 'homepage',
      campaign.status,
      campaign.currentStep || null,
      campaign.errorMessage || null,
      campaign.googleErrorDetails || null,
      campaign.suggestedAction || null,
      campaign.isDryRun ? 1 : 0,
      (campaign as any).networkCode || null,
      (campaign as any).gamAdvertiserId || null,
      (campaign as any).customName || null,
      campaign.createdAt,
      campaign.updatedAt
    );
    return campaign;
  },

  findById(id: string): Campaign | null {
    const row: any = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      advertiserId: row.advertiser_id,
      advertiserName: row.advertiser_name,
      bannerUrl: row.banner_url,
      targetUrl: row.target_url,
      startDate: row.start_date,
      endDate: row.end_date,
      sizes: JSON.parse(row.sizes || '[]'),
      position: row.position,
      status: row.status,
      currentStep: row.current_step,
      errorMessage: row.error_message,
      googleErrorDetails: row.google_error_details,
      suggestedAction: row.suggested_action,
      isDryRun: Boolean(row.is_dry_run),
      networkCode: row.network_code || null,
      gamAdvertiserId: row.gam_advertiser_id || null,
      customName: row.custom_name || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as any;
  },

  updateStatus(
    id: string,
    status: Campaign['status'],
    currentStep?: string,
    errorMessage?: string | null,
    googleErrorDetails?: string | null,
    suggestedAction?: string | null
  ): void {
    db.prepare(`
      UPDATE campaigns
      SET status = ?, current_step = ?, error_message = ?, google_error_details = ?, suggested_action = ?, updated_at = ?
      WHERE id = ?
    `).run(
      status,
      currentStep || null,
      errorMessage || null,
      googleErrorDetails || null,
      suggestedAction || null,
      new Date().toISOString(),
      id
    );
  },

  updateAdvertiserId(id: string, advertiserId: string): void {
    db.prepare('UPDATE campaigns SET advertiser_id = ?, updated_at = ? WHERE id = ?')
      .run(advertiserId, new Date().toISOString(), id);
  },

  list(): Campaign[] {
    const rows: any[] = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    return rows.map(row => ({
      id: row.id,
      advertiserId: row.advertiser_id,
      advertiserName: row.advertiser_name,
      bannerUrl: row.banner_url,
      targetUrl: row.target_url,
      startDate: row.start_date,
      endDate: row.end_date,
      sizes: JSON.parse(row.sizes || '[]'),
      position: row.position,
      status: row.status,
      currentStep: row.current_step,
      errorMessage: row.error_message,
      googleErrorDetails: row.google_error_details,
      suggestedAction: row.suggested_action,
      isDryRun: Boolean(row.is_dry_run),
      networkCode: row.network_code || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    // Cascade delete associated logs and tags
    try {
      db.prepare('DELETE FROM gpt_tags WHERE campaign_id = ?').run(id);
      db.prepare('DELETE FROM creative_associations WHERE campaign_id = ?').run(id);
      db.prepare('DELETE FROM creatives WHERE campaign_id = ?').run(id);
      db.prepare('DELETE FROM line_items WHERE campaign_id = ?').run(id);
      db.prepare('DELETE FROM orders WHERE campaign_id = ?').run(id);
      db.prepare('DELETE FROM api_logs WHERE campaign_id = ?').run(id);
    } catch (e) {
      console.warn('Cascade deletion warning:', e);
    }
    return info.changes > 0;
  }
};

export const orderRepo = {
  create(order: Order): Order {
    db.prepare(`
      INSERT INTO orders (id, campaign_id, google_order_id, name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      order.campaignId,
      order.googleOrderId || null,
      order.name,
      order.status,
      order.createdAt,
      order.updatedAt
    );
    return order;
  },

  findByCampaignId(campaignId: string): Order | null {
    const row: any = db.prepare('SELECT * FROM orders WHERE campaign_id = ?').get(campaignId);
    if (!row) return null;
    return {
      id: row.id,
      campaignId: row.campaign_id,
      googleOrderId: row.google_order_id,
      name: row.name,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  updateGoogleId(id: string, googleOrderId: string): void {
    db.prepare('UPDATE orders SET google_order_id = ?, updated_at = ? WHERE id = ?')
      .run(googleOrderId, new Date().toISOString(), id);
  }
};

export const lineItemRepo = {
  create(lineItem: LineItem): LineItem {
    db.prepare(`
      INSERT INTO line_items (
        id, campaign_id, order_id, google_line_item_id, name, size,
        start_date, end_date, line_item_type, cost_type, priority, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lineItem.id,
      lineItem.campaignId,
      lineItem.orderId,
      lineItem.googleLineItemId || null,
      lineItem.name,
      JSON.stringify(lineItem.size),
      lineItem.startDate,
      lineItem.endDate,
      lineItem.lineItemType,
      lineItem.costType,
      lineItem.priority,
      lineItem.status,
      lineItem.createdAt,
      lineItem.updatedAt
    );
    return lineItem;
  },

  findByCampaignId(campaignId: string): LineItem[] {
    const rows: any[] = db.prepare('SELECT * FROM line_items WHERE campaign_id = ?').all(campaignId);
    return rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      orderId: row.order_id,
      googleLineItemId: row.google_line_item_id,
      name: row.name,
      size: JSON.parse(row.size),
      startDate: row.start_date,
      endDate: row.end_date,
      lineItemType: row.line_item_type,
      costType: row.cost_type,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  updateGoogleId(id: string, googleLineItemId: string): void {
    db.prepare('UPDATE line_items SET google_line_item_id = ?, updated_at = ? WHERE id = ?')
      .run(googleLineItemId, new Date().toISOString(), id);
  }
};

export const creativeRepo = {
  create(creative: Creative): Creative {
    db.prepare(`
      INSERT INTO creatives (
        id, campaign_id, line_item_id, google_creative_id, name, banner_url,
        target_url, width, height, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      creative.id,
      creative.campaignId,
      creative.lineItemId || null,
      creative.googleCreativeId || null,
      creative.name,
      creative.bannerUrl,
      creative.targetUrl,
      creative.width,
      creative.height,
      creative.status,
      creative.createdAt,
      creative.updatedAt
    );
    return creative;
  },

  findByCampaignId(campaignId: string): Creative[] {
    const rows: any[] = db.prepare('SELECT * FROM creatives WHERE campaign_id = ?').all(campaignId);
    return rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      lineItemId: row.line_item_id,
      googleCreativeId: row.google_creative_id,
      name: row.name,
      bannerUrl: row.banner_url,
      targetUrl: row.target_url,
      width: row.width,
      height: row.height,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  updateGoogleId(id: string, googleCreativeId: string): void {
    db.prepare('UPDATE creatives SET google_creative_id = ?, updated_at = ? WHERE id = ?')
      .run(googleCreativeId, new Date().toISOString(), id);
  },

  findById(id: string): Creative | null {
    const row: any = db.prepare('SELECT * FROM creatives WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      campaignId: row.campaign_id,
      lineItemId: row.line_item_id,
      googleCreativeId: row.google_creative_id,
      name: row.name,
      bannerUrl: row.banner_url,
      targetUrl: row.target_url,
      width: row.width,
      height: row.height,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  updateBanner(id: string, bannerUrl: string, googleCreativeId?: string): void {
    db.prepare(`
      UPDATE creatives
      SET banner_url = ?, google_creative_id = COALESCE(?, google_creative_id), updated_at = ?
      WHERE id = ?
    `).run(bannerUrl, googleCreativeId || null, new Date().toISOString(), id);
  }
};

export const associationRepo = {
  create(assoc: CreativeAssociation): CreativeAssociation {
    db.prepare(`
      INSERT INTO creative_associations (id, line_item_id, creative_id, google_association_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      assoc.id,
      assoc.lineItemId,
      assoc.creativeId,
      assoc.googleAssociationId || null,
      assoc.status,
      assoc.createdAt
    );
    return assoc;
  },

  findByLineItemId(lineItemId: string): CreativeAssociation | null {
    const row: any = db.prepare('SELECT * FROM creative_associations WHERE line_item_id = ?').get(lineItemId);
    if (!row) return null;
    return {
      id: row.id,
      lineItemId: row.line_item_id,
      creativeId: row.creative_id,
      googleAssociationId: row.google_association_id,
      status: row.status,
      createdAt: row.created_at
    };
  },

  updateGoogleId(id: string, googleAssociationId: string): void {
    db.prepare('UPDATE creative_associations SET google_association_id = ? WHERE id = ?')
      .run(googleAssociationId, id);
  }
};

export const gptTagRepo = {
  create(tag: GptTag): GptTag {
    db.prepare(`
      INSERT INTO gpt_tags (
        id, campaign_id, ad_unit_id, size, div_id, head_code, body_code, complete_code, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tag.id,
      tag.campaignId,
      tag.adUnitId || null,
      JSON.stringify(tag.size),
      tag.divId,
      tag.headCode,
      tag.bodyCode,
      tag.completeCode,
      tag.createdAt,
      tag.updatedAt
    );
    return tag;
  },

  findByCampaignId(campaignId: string): GptTag[] {
    const rows: any[] = db.prepare('SELECT * FROM gpt_tags WHERE campaign_id = ?').all(campaignId);
    return rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      adUnitId: row.ad_unit_id,
      size: JSON.parse(row.size),
      divId: row.div_id,
      headCode: row.head_code,
      bodyCode: row.body_code,
      completeCode: row.complete_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
};

export const logRepo = {
  create(log: ApiLog): ApiLog {
    // Sanitize credentials from log data before saving
    const sanitizeObj = (obj: any) => {
      if (!obj) return obj;
      try {
        const copy = JSON.parse(JSON.stringify(obj));
        const sanitizeKeys = ['client_secret', 'clientSecret', 'refresh_token', 'refreshToken', 'access_token', 'accessToken', 'password', 'Authorization'];
        const walk = (target: any) => {
          if (typeof target !== 'object' || target === null) return;
          for (const k of Object.keys(target)) {
            if (sanitizeKeys.includes(k)) {
              target[k] = '***MASKED***';
            } else if (typeof target[k] === 'object') {
              walk(target[k]);
            }
          }
        };
        walk(copy);
        return copy;
      } catch {
        return obj;
      }
    };

    db.prepare(`
      INSERT INTO api_logs (
        id, campaign_id, operation, service, request_data, response_data, status, error_message, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id,
      log.campaignId || null,
      log.operation,
      log.service,
      typeof log.requestData === 'object' ? JSON.stringify(sanitizeObj(log.requestData)) : String(log.requestData || ''),
      typeof log.responseData === 'object' ? JSON.stringify(sanitizeObj(log.responseData)) : String(log.responseData || ''),
      log.status,
      log.errorMessage || null,
      log.durationMs || 0,
      log.createdAt
    );
    return log;
  },

  list(limit: number = 100): ApiLog[] {
    const rows: any[] = db.prepare('SELECT * FROM api_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map(row => {
      const safeParse = (val: string | null) => {
        if (!val) return null;
        try { return JSON.parse(val); } catch { return { raw: val }; }
      };
      return {
        id: row.id,
        campaignId: row.campaign_id,
        operation: row.operation,
        service: row.service,
        requestData: safeParse(row.request_data),
        responseData: safeParse(row.response_data),
        status: row.status,
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        createdAt: row.created_at
      };
    });
  },

  findByCampaignId(campaignId: string): ApiLog[] {
    const rows: any[] = db.prepare('SELECT * FROM api_logs WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId);
    return rows.map(row => {
      const safeParse = (val: string | null) => {
        if (!val) return null;
        try { return JSON.parse(val); } catch { return { raw: val }; }
      };
      return {
        id: row.id,
        campaignId: row.campaign_id,
        operation: row.operation,
        service: row.service,
        requestData: safeParse(row.request_data),
        responseData: safeParse(row.response_data),
        status: row.status,
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        createdAt: row.created_at
      };
    });
  },

  clearAll(): number {
    const info = db.prepare('DELETE FROM api_logs').run();
    return info.changes;
  }
};

export const settingsRepo = {
  get(): any {
    const row: any = db.prepare('SELECT value FROM settings WHERE key = ?').get('system_config');
    if (!row) return null;
    return JSON.parse(row.value);
  },

  save(settingsObj: any): void {
    db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
      .run('system_config', JSON.stringify(settingsObj), new Date().toISOString());
  }
};
