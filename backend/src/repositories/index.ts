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
  UserRecord,
  UserAuditLog,
  CmsPartner,
  GamClient,
  GamClientInput,
  GamAccountInfo
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
      networkCode: row.network_code || undefined,
      partnerName: row.partner_name || undefined,
      advertiserId: row.advertiser_id || undefined,
      advertiserName: row.advertiser_name || undefined,
      status: row.status || 'active',
      mustChangePassword: Boolean(row.must_change_password),
      lastLoginAt: row.last_login_at || undefined,
      isDeleted: Boolean(row.is_deleted),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findById(id: string): User | null {
    const row: any = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar,
      networkCode: row.network_code || undefined,
      partnerName: row.partner_name || undefined,
      advertiserId: row.advertiser_id || undefined,
      advertiserName: row.advertiser_name || undefined,
      status: row.status || 'active',
      mustChangePassword: Boolean(row.must_change_password),
      lastLoginAt: row.last_login_at || undefined,
      isDeleted: Boolean(row.is_deleted),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(data: {
    name: string;
    email: string;
    password: string;
    role?: User['role'];
    avatar?: string;
    networkCode?: string;
    partnerName?: string;
    advertiserId?: string;
    advertiserName?: string;
    status?: 'active' | 'deactivated';
    mustChangePassword?: boolean;
  }): User {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(data.password, salt, 64).toString('hex');
    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const role = data.role || 'trafficker';
    const avatar = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`;
    const networkCode = data.networkCode || 'ALL';
    const partnerName = data.partnerName || 'All Networks (Global Admin)';
    const advertiserId = data.advertiserId || 'ALL';
    const advertiserName = data.advertiserName || 'All Advertisers';
    const status = data.status || 'active';
    const mustChangePassword = data.mustChangePassword ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, role, avatar, network_code, partner_name, advertiser_id, advertiser_name, status, must_change_password, is_deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      data.name.trim(),
      data.email.trim().toLowerCase(),
      passwordHash,
      salt,
      role,
      avatar,
      networkCode,
      partnerName,
      advertiserId,
      advertiserName,
      status,
      mustChangePassword,
      now,
      now
    );

    return {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role,
      avatar,
      networkCode,
      partnerName,
      advertiserId,
      advertiserName,
      status,
      mustChangePassword: Boolean(mustChangePassword),
      createdAt: now,
      updatedAt: now
    };
  },

  update(id: string, data: Partial<User>): User | null {
    const existing = userRepo.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const email = data.email !== undefined ? data.email.trim().toLowerCase() : existing.email;
    const role = data.role !== undefined ? data.role : existing.role;
    const networkCode = data.networkCode !== undefined ? data.networkCode : (existing.networkCode || 'ALL');
    const partnerName = data.partnerName !== undefined ? data.partnerName : (existing.partnerName || 'All Networks');
    const advertiserId = data.advertiserId !== undefined ? data.advertiserId : (existing.advertiserId || 'ALL');
    const advertiserName = data.advertiserName !== undefined ? data.advertiserName : (existing.advertiserName || 'All Advertisers');
    const status = data.status !== undefined ? data.status : (existing.status || 'active');

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, role = ?, network_code = ?, partner_name = ?, advertiser_id = ?, advertiser_name = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(name, email, role, networkCode, partnerName, advertiserId, advertiserName, status, now, id);

    return userRepo.findById(id);
  },

  updateStatus(id: string, status: 'active' | 'deactivated'): boolean {
    const now = new Date().toISOString();
    const res = db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    return res.changes > 0;
  },

  resetPassword(id: string, newPassword: string, mustChangePassword = true): boolean {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE users
      SET password_hash = ?, salt = ?, must_change_password = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, salt, mustChangePassword ? 1 : 0, now, id);
    return res.changes > 0;
  },

  changePassword(id: string, newPassword: string): boolean {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE users
      SET password_hash = ?, salt = ?, must_change_password = 0, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, salt, now, id);
    return res.changes > 0;
  },

  recordLogin(id: string): void {
    const now = new Date().toISOString();
    try {
      db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, id);
    } catch {}
  },

  verifyPassword(userRecord: UserRecord, passwordAttempt: string): boolean {
    const hashAttempt = crypto.scryptSync(passwordAttempt, userRecord.salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(userRecord.passwordHash, 'hex'), Buffer.from(hashAttempt, 'hex'));
  },

  list(includeDeleted = false): User[] {
    const query = includeDeleted
      ? 'SELECT * FROM users ORDER BY created_at DESC'
      : 'SELECT * FROM users WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY created_at DESC';
    const rows: any[] = db.prepare(query).all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatar: r.avatar,
      networkCode: r.network_code || undefined,
      partnerName: r.partner_name || undefined,
      advertiserId: r.advertiser_id || undefined,
      advertiserName: r.advertiser_name || undefined,
      status: r.status || 'active',
      mustChangePassword: Boolean(r.must_change_password),
      lastLoginAt: r.last_login_at || undefined,
      isDeleted: Boolean(r.is_deleted),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  softDelete(id: string): boolean {
    const now = new Date().toISOString();
    const res = db.prepare('UPDATE users SET is_deleted = 1, status = ?, updated_at = ? WHERE id = ?').run('deactivated', now, id);
    return res.changes > 0;
  },

  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

export const userAuditRepo = {
  logAction(entry: {
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    targetUserEmail: string;
    action: UserAuditLog['action'];
    details?: Record<string, any>;
  }): UserAuditLog {
    const id = `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const detailsJson = entry.details ? JSON.stringify(entry.details) : null;
    db.prepare(`
      INSERT INTO user_audit_logs (id, admin_id, admin_email, target_user_id, target_user_email, action, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, entry.adminId, entry.adminEmail, entry.targetUserId, entry.targetUserEmail, entry.action, detailsJson, now);

    return {
      id,
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      targetUserId: entry.targetUserId,
      targetUserEmail: entry.targetUserEmail,
      action: entry.action,
      details: entry.details,
      createdAt: now
    };
  },

  list(limit = 100): UserAuditLog[] {
    const rows: any[] = db.prepare('SELECT * FROM user_audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map(r => ({
      id: r.id,
      adminId: r.admin_id,
      adminEmail: r.admin_email,
      targetUserId: r.target_user_id,
      targetUserEmail: r.target_user_email,
      action: r.action,
      details: r.details ? JSON.parse(r.details) : undefined,
      createdAt: r.created_at
    }));
  }
};


export const advertiserRepo = {
  findByName(name: string, networkCode?: string): Advertiser | null {
    let row: any;
    if (networkCode && networkCode !== 'ALL') {
      row = db.prepare('SELECT * FROM advertisers WHERE LOWER(name) = LOWER(?) AND network_code = ?').get(name, networkCode);
    } else {
      row = db.prepare('SELECT * FROM advertisers WHERE LOWER(name) = LOWER(?)').get(name);
    }
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      googleAdvertiserId: row.google_advertiser_id,
      status: row.status,
      networkCode: row.network_code || undefined,
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
      networkCode: row.network_code || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(advertiser: Advertiser): Advertiser {
    db.prepare(`
      INSERT INTO advertisers (id, name, google_advertiser_id, status, network_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      advertiser.id,
      advertiser.name,
      advertiser.googleAdvertiserId || null,
      advertiser.status,
      advertiser.networkCode || null,
      advertiser.createdAt,
      advertiser.updatedAt
    );
    return advertiser;
  },

  updateGoogleId(id: string, googleAdvertiserId: string): void {
    db.prepare('UPDATE advertisers SET google_advertiser_id = ?, updated_at = ? WHERE id = ?')
      .run(googleAdvertiserId, new Date().toISOString(), id);
  },

  updateNetworkCode(id: string, networkCode: string): void {
    db.prepare('UPDATE advertisers SET network_code = ?, updated_at = ? WHERE id = ?')
      .run(networkCode, new Date().toISOString(), id);
  },

  list(networkCode?: string): Advertiser[] {
    let rows: any[];
    if (networkCode && networkCode !== 'ALL') {
      rows = db.prepare('SELECT * FROM advertisers WHERE network_code = ? ORDER BY created_at DESC').all(networkCode);
    } else {
      rows = db.prepare('SELECT * FROM advertisers ORDER BY created_at DESC').all();
    }
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      googleAdvertiserId: row.google_advertiser_id,
      status: row.status,
      networkCode: row.network_code || undefined,
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
      networkCode: row.network_code,
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
      networkCode: row.network_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  create(adUnit: AdUnit): AdUnit {
    db.prepare(`
      INSERT INTO ad_units (id, name, code, google_ad_unit_id, parent_google_ad_unit_id, sizes, status, network_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adUnit.id,
      adUnit.name,
      adUnit.code,
      adUnit.googleAdUnitId || null,
      adUnit.parentGoogleAdUnitId || null,
      JSON.stringify(adUnit.sizes),
      adUnit.status,
      adUnit.networkCode || null,
      adUnit.createdAt,
      adUnit.updatedAt
    );
    return adUnit;
  },

  updateGoogleId(id: string, googleAdUnitId: string): void {
    db.prepare('UPDATE ad_units SET google_ad_unit_id = ?, updated_at = ? WHERE id = ?')
      .run(googleAdUnitId, new Date().toISOString(), id);
  },

  updateNetworkCode(id: string, networkCode: string): void {
    db.prepare('UPDATE ad_units SET network_code = ?, updated_at = ? WHERE id = ?')
      .run(networkCode, new Date().toISOString(), id);
  },

  list(networkCode?: string, isAdmin: boolean = false): AdUnit[] {
    let rows: any[];
    if (networkCode && networkCode !== 'ALL') {
      if (networkCode === 'DEFAULT' || networkCode === 'GLOBAL') {
        rows = db.prepare("SELECT * FROM ad_units WHERE network_code IS NULL OR network_code = '' ORDER BY created_at DESC").all();
      } else {
        rows = db.prepare('SELECT * FROM ad_units WHERE network_code = ? ORDER BY created_at DESC').all(networkCode);
      }
    } else {
      if (isAdmin) {
        rows = db.prepare('SELECT * FROM ad_units ORDER BY created_at DESC').all();
      } else {
        rows = db.prepare("SELECT * FROM ad_units WHERE network_code IS NOT NULL AND network_code != '' ORDER BY created_at DESC").all();
      }
    }
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      googleAdUnitId: row.google_ad_unit_id,
      parentGoogleAdUnitId: row.parent_google_ad_unit_id,
      sizes: JSON.parse(row.sizes || '[]'),
      status: row.status,
      networkCode: row.network_code,
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
        network_code, gam_advertiser_id, custom_name, created_by, creator_email, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      (campaign as any).createdBy || null,
      (campaign as any).creatorEmail || null,
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
      cmsSyncStatus: row.cms_sync_status || null,
      cmsSyncedAt: row.cms_synced_at || null,
      createdBy: row.created_by || null,
      creatorEmail: row.creator_email || null,
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

  updateCmsSync(id: string, status: string): void {
    db.prepare(`
      UPDATE campaigns
      SET cms_sync_status = ?, cms_synced_at = ?, updated_at = ?
      WHERE id = ?
    `).run(status, new Date().toISOString(), new Date().toISOString(), id);
  },

  updateAdvertiserId(id: string, advertiserId: string): void {
    db.prepare('UPDATE campaigns SET advertiser_id = ?, updated_at = ? WHERE id = ?')
      .run(advertiserId, new Date().toISOString(), id);
  },

  list(networkCode?: string, advertiserName?: string): Campaign[] {
    let rows: any[];
    const hasNet = networkCode && networkCode !== 'ALL';
    const hasAdv = advertiserName && advertiserName !== 'ALL' && advertiserName !== 'All Advertisers';

    if (hasNet && hasAdv) {
      rows = db.prepare('SELECT * FROM campaigns WHERE network_code = ? AND LOWER(advertiser_name) = LOWER(?) ORDER BY created_at DESC').all(networkCode, advertiserName);
    } else if (hasNet) {
      rows = db.prepare('SELECT * FROM campaigns WHERE network_code = ? ORDER BY created_at DESC').all(networkCode);
    } else if (hasAdv) {
      rows = db.prepare('SELECT * FROM campaigns WHERE LOWER(advertiser_name) = LOWER(?) ORDER BY created_at DESC').all(advertiserName);
    } else {
      rows = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    }
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
      customName: row.custom_name || null,
      cmsSyncStatus: row.cms_sync_status || null,
      cmsSyncedAt: row.cms_synced_at || null,
      createdBy: row.created_by || null,
      creatorEmail: row.creator_email || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    // Cascade delete associated logs, tags, creatives, line items, and orders
    try {
      db.prepare('DELETE FROM gpt_tags WHERE campaign_id = ?').run(id);
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

export const cmsPartnerRepo = {
  list(): CmsPartner[] {
    const rows: any[] = db.prepare('SELECT * FROM cms_partners ORDER BY created_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      cmsType: r.cms_type,
      endpoint: r.endpoint,
      apiPath: r.api_path,
      securityToken: r.security_token,
      autoSyncCampaigns: Boolean(r.auto_sync_campaigns),
      autoSyncAdUnits: Boolean(r.auto_sync_ad_units),
      isActive: Boolean(r.is_active),
      lastSyncAt: r.last_sync_at,
      lastSyncStatus: r.last_sync_status,
      lastSyncMessage: r.last_sync_message,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  findById(id: string): CmsPartner | null {
    const r: any = db.prepare('SELECT * FROM cms_partners WHERE id = ?').get(id);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      cmsType: r.cms_type,
      endpoint: r.endpoint,
      apiPath: r.api_path,
      securityToken: r.security_token,
      autoSyncCampaigns: Boolean(r.auto_sync_campaigns),
      autoSyncAdUnits: Boolean(r.auto_sync_ad_units),
      isActive: Boolean(r.is_active),
      lastSyncAt: r.last_sync_at,
      lastSyncStatus: r.last_sync_status,
      lastSyncMessage: r.last_sync_message,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  },

  findActive(): CmsPartner[] {
    const rows: any[] = db.prepare('SELECT * FROM cms_partners WHERE is_active = 1').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      cmsType: r.cms_type,
      endpoint: r.endpoint,
      apiPath: r.api_path,
      securityToken: r.security_token,
      autoSyncCampaigns: Boolean(r.auto_sync_campaigns),
      autoSyncAdUnits: Boolean(r.auto_sync_ad_units),
      isActive: Boolean(r.is_active),
      lastSyncAt: r.last_sync_at,
      lastSyncStatus: r.last_sync_status,
      lastSyncMessage: r.last_sync_message,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  },

  create(partner: Partial<CmsPartner> & { name: string; endpoint: string; apiPath: string; securityToken: string }): CmsPartner {
    const id = partner.id || `partner_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const cmsType = partner.cmsType || 'HOCALWIRE';
    const autoSyncCampaigns = partner.autoSyncCampaigns !== false ? 1 : 0;
    const autoSyncAdUnits = partner.autoSyncAdUnits !== false ? 1 : 0;
    const isActive = partner.isActive !== false ? 1 : 0;

    db.prepare(`
      INSERT INTO cms_partners (
        id, name, cms_type, endpoint, api_path, security_token, auto_sync_campaigns, auto_sync_ad_units, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      partner.name.trim(),
      cmsType,
      partner.endpoint.trim(),
      partner.apiPath.trim(),
      partner.securityToken.trim(),
      autoSyncCampaigns,
      autoSyncAdUnits,
      isActive,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, partner: Partial<CmsPartner>): CmsPartner | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = partner.name !== undefined ? partner.name.trim() : existing.name;
    const cmsType = partner.cmsType !== undefined ? partner.cmsType : existing.cmsType;
    const endpoint = partner.endpoint !== undefined ? partner.endpoint.trim() : existing.endpoint;
    const apiPath = partner.apiPath !== undefined ? partner.apiPath.trim() : existing.apiPath;
    const securityToken = partner.securityToken !== undefined ? partner.securityToken.trim() : existing.securityToken;
    const autoSyncCampaigns = partner.autoSyncCampaigns !== undefined ? (partner.autoSyncCampaigns ? 1 : 0) : (existing.autoSyncCampaigns ? 1 : 0);
    const autoSyncAdUnits = partner.autoSyncAdUnits !== undefined ? (partner.autoSyncAdUnits ? 1 : 0) : (existing.autoSyncAdUnits ? 1 : 0);
    const isActive = partner.isActive !== undefined ? (partner.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    db.prepare(`
      UPDATE cms_partners SET
        name = ?, cms_type = ?, endpoint = ?, api_path = ?, security_token = ?,
        auto_sync_campaigns = ?, auto_sync_ad_units = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, cmsType, endpoint, apiPath, securityToken,
      autoSyncCampaigns, autoSyncAdUnits, isActive, now, id
    );

    return this.findById(id);
  },

  updateSyncStatus(id: string, status: 'SUCCESS' | 'ERROR', message?: string): void {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE cms_partners SET
        last_sync_at = ?, last_sync_status = ?, last_sync_message = ?, updated_at = ?
      WHERE id = ?
    `).run(now, status, message || null, now, id);
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM cms_partners WHERE id = ?').run(id);
    return info.changes > 0;
  }
};

export const clientRepo = {
  list(): GamClient[] {
    const rows: any[] = db.prepare('SELECT * FROM gam_clients ORDER BY created_at DESC').all();
    return rows.map(r => this.mapRow(r));
  },

  findById(id: string): GamClient | null {
    const r: any = db.prepare('SELECT * FROM gam_clients WHERE id = ?').get(id);
    if (!r) return null;
    return this.mapRow(r);
  },

  findByNetworkCode(networkCode: string): GamClient | null {
    const r: any = db.prepare('SELECT * FROM gam_clients WHERE network_code = ?').get(String(networkCode).trim());
    if (!r) return null;
    return this.mapRow(r);
  },

  getRawCredentials(id: string): { serviceAccountKey?: string; refreshToken?: string; credentialsType: string } | null {
    const r: any = db.prepare('SELECT credentials_type, service_account_key, refresh_token FROM gam_clients WHERE id = ?').get(id);
    if (!r) return null;
    return {
      credentialsType: r.credentials_type,
      serviceAccountKey: r.service_account_key || undefined,
      refreshToken: r.refresh_token || undefined
    };
  },

  create(data: GamClientInput & { id?: string; createdBy?: string }): GamClient {
    const id = data.id || `client_${data.networkCode}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const clientName = data.clientName.trim();
    const networkCode = data.networkCode.trim();
    const credentialsType = data.credentialsType || 'GLOBAL_SERVICE_ACCOUNT';
    const status = data.status || 'ACTIVE';

    db.prepare(`
      INSERT INTO gam_clients (
        id, client_name, network_code, gam_network_id, display_name, time_zone, currency_code,
        effective_root_ad_unit_id, credentials_type, service_account_key, refresh_token, client_email,
        notes, status, last_synced_at, sync_status, sync_message, account_info, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      clientName,
      networkCode,
      null,
      clientName,
      'America/New_York',
      'USD',
      null,
      credentialsType,
      data.serviceAccountKey || null,
      data.refreshToken || null,
      data.clientEmail || null,
      data.notes || null,
      status,
      null,
      'PENDING',
      'Client registered. Ready to pull GAM account information.',
      null,
      data.createdBy || null,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: Partial<GamClient> & { serviceAccountKey?: string; refreshToken?: string }): GamClient | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const clientName = data.clientName !== undefined ? data.clientName.trim() : existing.clientName;
    const networkCode = data.networkCode !== undefined ? data.networkCode.trim() : existing.networkCode;
    const displayName = data.displayName !== undefined ? data.displayName : existing.displayName;
    const gamNetworkId = data.gamNetworkId !== undefined ? data.gamNetworkId : existing.gamNetworkId;
    const timeZone = data.timeZone !== undefined ? data.timeZone : existing.timeZone;
    const currencyCode = data.currencyCode !== undefined ? data.currencyCode : existing.currencyCode;
    const effectiveRootAdUnitId = data.effectiveRootAdUnitId !== undefined ? data.effectiveRootAdUnitId : existing.effectiveRootAdUnitId;
    const credentialsType = data.credentialsType !== undefined ? data.credentialsType : existing.credentialsType;
    const clientEmail = data.clientEmail !== undefined ? data.clientEmail : existing.clientEmail;
    const notes = data.notes !== undefined ? data.notes : existing.notes;
    const status = data.status !== undefined ? data.status : existing.status;

    // Handle key/token updates: ignore masked '********'
    const raw = this.getRawCredentials(id);
    let finalKey = raw?.serviceAccountKey;
    if (data.serviceAccountKey !== undefined) {
      if (data.serviceAccountKey === 'REMOVE' || data.serviceAccountKey === '') {
        finalKey = undefined;
      } else if (data.serviceAccountKey !== '********') {
        finalKey = data.serviceAccountKey;
      }
    }

    let finalToken = raw?.refreshToken;
    if (data.refreshToken !== undefined) {
      if (data.refreshToken === 'REMOVE' || data.refreshToken === '') {
        finalToken = undefined;
      } else if (data.refreshToken !== '********') {
        finalToken = data.refreshToken;
      }
    }

    db.prepare(`
      UPDATE gam_clients SET
        client_name = ?, network_code = ?, display_name = ?, gam_network_id = ?, time_zone = ?,
        currency_code = ?, effective_root_ad_unit_id = ?, credentials_type = ?,
        service_account_key = ?, refresh_token = ?, client_email = ?, notes = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      clientName, networkCode, displayName || null, gamNetworkId || null, timeZone || null,
      currencyCode || null, effectiveRootAdUnitId || null, credentialsType,
      finalKey || null, finalToken || null, clientEmail || null, notes || null, status, now, id
    );

    return this.findById(id);
  },

  updateSyncResult(id: string, syncData: {
    gamNetworkId?: string;
    displayName?: string;
    timeZone?: string;
    currencyCode?: string;
    effectiveRootAdUnitId?: string;
    syncStatus: 'SUCCESS' | 'ERROR';
    syncMessage?: string;
    accountInfo?: GamAccountInfo;
  }): GamClient | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE gam_clients SET
        gam_network_id = COALESCE(?, gam_network_id),
        display_name = COALESCE(?, display_name),
        time_zone = COALESCE(?, time_zone),
        currency_code = COALESCE(?, currency_code),
        effective_root_ad_unit_id = COALESCE(?, effective_root_ad_unit_id),
        last_synced_at = ?,
        sync_status = ?,
        sync_message = ?,
        account_info = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      syncData.gamNetworkId || null,
      syncData.displayName || null,
      syncData.timeZone || null,
      syncData.currencyCode || null,
      syncData.effectiveRootAdUnitId || null,
      now,
      syncData.syncStatus,
      syncData.syncMessage || null,
      syncData.accountInfo ? JSON.stringify(syncData.accountInfo) : null,
      now,
      id
    );

    return this.findById(id);
  },

  delete(id: string): boolean {
    const info = db.prepare('DELETE FROM gam_clients WHERE id = ?').run(id);
    return info.changes > 0;
  },

  mapRow(r: any): GamClient {
    let accountInfo: GamAccountInfo | undefined = undefined;
    if (r.account_info) {
      try {
        accountInfo = JSON.parse(r.account_info);
      } catch {}
    }

    return {
      id: r.id,
      clientName: r.client_name,
      networkCode: r.network_code,
      gamNetworkId: r.gam_network_id || undefined,
      displayName: r.display_name || undefined,
      timeZone: r.time_zone || 'America/New_York',
      currencyCode: r.currency_code || 'USD',
      effectiveRootAdUnitId: r.effective_root_ad_unit_id || undefined,
      credentialsType: r.credentials_type || 'GLOBAL_SERVICE_ACCOUNT',
      serviceAccountKey: r.service_account_key ? '********' : undefined,
      refreshToken: r.refresh_token ? '********' : undefined,
      clientEmail: r.client_email || undefined,
      notes: r.notes || undefined,
      status: r.status || 'ACTIVE',
      lastSyncedAt: r.last_synced_at || undefined,
      syncStatus: r.sync_status || 'PENDING',
      syncMessage: r.sync_message || undefined,
      accountInfo,
      createdBy: r.created_by || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
};

