import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'gam_automation.db');
export const db = new Database(dbPath);

// Enable WAL mode for concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      google_advertiser_id TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ad_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      google_ad_unit_id TEXT,
      parent_google_ad_unit_id TEXT,
      sizes TEXT NOT NULL, -- JSON string of AdSize[]
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      advertiser_id TEXT,
      advertiser_name TEXT NOT NULL,
      banner_url TEXT NOT NULL,
      target_url TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      sizes TEXT NOT NULL, -- JSON string of AdSize[]
      position TEXT DEFAULT 'homepage',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      current_step TEXT,
      error_message TEXT,
      google_error_details TEXT,
      suggested_action TEXT,
      is_dry_run INTEGER DEFAULT 0,
      created_by TEXT,
      creator_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (advertiser_id) REFERENCES advertisers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      google_order_id TEXT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      google_line_item_id TEXT,
      name TEXT NOT NULL,
      size TEXT NOT NULL, -- JSON string of AdSize
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      line_item_type TEXT DEFAULT 'STANDARD',
      cost_type TEXT DEFAULT 'CPM',
      priority INTEGER DEFAULT 8,
      status TEXT DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS creatives (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      line_item_id TEXT,
      google_creative_id TEXT,
      name TEXT NOT NULL,
      banner_url TEXT NOT NULL,
      target_url TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS creative_associations (
      id TEXT PRIMARY KEY,
      line_item_id TEXT NOT NULL,
      creative_id TEXT NOT NULL,
      google_association_id TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (line_item_id) REFERENCES line_items(id) ON DELETE CASCADE,
      FOREIGN KEY (creative_id) REFERENCES creatives(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gpt_tags (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      ad_unit_id TEXT,
      size TEXT NOT NULL, -- JSON string of AdSize
      div_id TEXT NOT NULL,
      head_code TEXT NOT NULL,
      body_code TEXT NOT NULL,
      complete_code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      operation TEXT NOT NULL,
      service TEXT NOT NULL,
      request_data TEXT,
      response_data TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'trafficker',
      avatar TEXT,
      network_code TEXT,
      partner_name TEXT,
      advertiser_id TEXT DEFAULT 'ALL',
      advertiser_name TEXT DEFAULT 'All Advertisers',
      status TEXT DEFAULT 'active',
      must_change_password INTEGER DEFAULT 0,
      last_login_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_email TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      target_user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
 
    CREATE TABLE IF NOT EXISTS cms_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cms_type TEXT DEFAULT 'HOCALWIRE',
      endpoint TEXT NOT NULL,
      api_path TEXT NOT NULL,
      security_token TEXT NOT NULL,
      auto_sync_campaigns INTEGER DEFAULT 1,
      auto_sync_ad_units INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      last_sync_at TEXT,
      last_sync_status TEXT,
      last_sync_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gam_clients (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      network_code TEXT NOT NULL UNIQUE,
      gam_network_id TEXT,
      display_name TEXT,
      time_zone TEXT DEFAULT 'America/New_York',
      currency_code TEXT DEFAULT 'USD',
      effective_root_ad_unit_id TEXT,
      credentials_type TEXT DEFAULT 'GLOBAL_SERVICE_ACCOUNT',
      service_account_key TEXT,
      refresh_token TEXT,
      client_email TEXT,
      notes TEXT,
      status TEXT DEFAULT 'ACTIVE',
      last_synced_at TEXT,
      sync_status TEXT DEFAULT 'PENDING',
      sync_message TEXT,
      account_info TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try { db.exec(`ALTER TABLE users ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN partner_name TEXT`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN advertiser_id TEXT DEFAULT 'ALL'`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN advertiser_name TEXT DEFAULT 'All Advertisers'`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN created_by TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN creator_email TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN custom_name TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN gam_advertiser_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN line_item_type TEXT DEFAULT 'SPONSORSHIP'`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN creative_type TEXT DEFAULT 'IMAGE'`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN assets_map TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN third_party_snippet TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN is_safe_frame_compatible INTEGER DEFAULT 1`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN cm360_url TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN custom_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN native_fields TEXT`); } catch {}
  try { db.exec(`ALTER TABLE creatives ADD COLUMN creative_type TEXT DEFAULT 'IMAGE'`); } catch {}
  try { db.exec(`ALTER TABLE ad_units ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE advertisers ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE gam_clients ADD COLUMN effective_root_ad_unit_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE gam_clients ADD COLUMN account_info TEXT`); } catch {}

  // Seed default managed GAM clients if none exist
  try {
    const existingClientCount = (db.prepare('SELECT COUNT(*) as cnt FROM gam_clients').get() as any)?.cnt || 0;
    if (existingClientCount === 0) {
      const now = new Date().toISOString();
      const initialClients = [
        { name: 'Blinkcorp Technologies Private Limited', code: '22068249324', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'The Federal', code: '22665183713', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'News Track', code: '22212039110', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'new powergame dot com', code: '22827981500', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'Hyderabad Media House L.', code: '310443190', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'Illustrated Daily News', code: '22674196146', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'pappu farishta', code: '22671723195', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'Pratahkal Multimedia', code: '23345489262', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'Shreya Broadcasting Pvt L.', code: '83023919', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' },
        { name: 'Vartha Bharati', code: '20030162679', tz: 'Asia/Kolkata', cur: 'INR', status: 'ACTIVE' }
      ];

      const insertClient = db.prepare(`
        INSERT INTO gam_clients (
          id, client_name, network_code, gam_network_id, display_name, time_zone, currency_code,
          credentials_type, status, last_synced_at, sync_status, sync_message, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < initialClients.length; i++) {
        const c = initialClients[i];
        insertClient.run(
          `client_${c.code}_001`,
          c.name,
          c.code,
          c.code,
          c.name,
          c.tz,
          c.cur,
          'GLOBAL_SERVICE_ACCOUNT',
          c.status,
          now,
          'SUCCESS',
          'Initial system seed',
          'SYSTEM_SEED',
          now,
          now
        );
      }
    }

    // Ensure decommissioned connections (Gaon Connection, Dhanam) are purged from database
    db.prepare("DELETE FROM gam_clients WHERE network_code IN ('86902771', '22590922850')").run();
  } catch (err) {
    console.error('Error seeding initial GAM clients:', err);
  }

  // Seed default demo accounts
  try {
    const crypto = require('crypto');
    const now = new Date().toISOString();

    // 1. Seed or update Admin Demo (Global Access across all networks)
    const adminUser: any = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('admin@gam.io');
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = crypto.scryptSync('Admin@12345', adminSalt, 64).toString('hex');
    if (!adminUser) {
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, salt, role, avatar, network_code, partner_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'usr_admin_001',
        'Administrator (Global)',
        'admin@gam.io',
        adminHash,
        adminSalt,
        'admin',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop',
        'ALL',
        'All Networks (Global Admin)',
        now,
        now
      );
    } else {
      db.prepare(`
        UPDATE users 
        SET role = 'admin', network_code = 'ALL', partner_name = 'All Networks (Global Admin)', updated_at = ?
        WHERE id = ?
      `).run(now, adminUser.id);
    }

    // 2. Seed or update Blink Corp Partner Demo (Scoped strictly to Blinkcorp Technologies 22068249324)
    const blinkUser: any = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('blink@gam.io');
    if (!blinkUser) {
      const bSalt = crypto.randomBytes(16).toString('hex');
      const bHash = crypto.scryptSync('Partner@12345', bSalt, 64).toString('hex');
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, salt, role, avatar, network_code, partner_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'usr_partner_blink_001',
        'Blink Corp Partner Lead',
        'blink@gam.io',
        bHash,
        bSalt,
        'trafficker',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop',
        '22068249324',
        'Blinkcorp Technologies Private Limited',
        now,
        now
      );
    } else {
      db.prepare("UPDATE users SET is_deleted = 0, status = 'active' WHERE id = ?").run(blinkUser.id);
    }

    // 3. Seed or update The Federal Partner Demo (Scoped strictly to The Federal 22665183713)
    const federalUser: any = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('thefederal@gam.io');
    if (!federalUser) {
      const fSalt = crypto.randomBytes(16).toString('hex');
      const fHash = crypto.scryptSync('Partner@12345', fSalt, 64).toString('hex');
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, salt, role, avatar, network_code, partner_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'usr_partner_federal_001',
        'The Federal AdOps Lead',
        'thefederal@gam.io',
        fHash,
        fSalt,
        'adops',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
        '22665183713',
        'The Federal',
        now,
        now
      );
    } else {
      db.prepare("UPDATE users SET is_deleted = 0, status = 'active' WHERE id = ?").run(federalUser.id);
    }
  } catch (err) {
    console.error('Error seeding demo users:', err);
  }

  // Seed default settings if not existing
  const stmt = db.prepare('SELECT key FROM settings WHERE key = ?');
  if (!stmt.get('system_config')) {
    const defaultSettings = {
      networkCode: process.env.GOOGLE_AD_MANAGER_NETWORK_CODE || '12345678',
      networkName: 'Primary Google Ad Manager Network',
      timeZone: 'America/New_York',
      currencyCode: 'USD',
      apiVersion: process.env.GAM_API_VERSION || 'v202511',
      defaultLineItemType: 'SPONSORSHIP',
      defaultPriority: 4,
      defaultCostType: 'CPM',
      defaultDeliveryRate: 'EVENLY',
      namingPrefix: 'newstrack',
      isConfigured: true,
      availableSizes: [
        { width: 300, height: 250, label: '300x250 - Medium Rectangle', isDefault: true, enabled: true },
        { width: 728, height: 90, label: '728x90 - Leaderboard', isDefault: false, enabled: true },
        { width: 970, height: 250, label: '970x250 - Billboard', isDefault: false, enabled: true },
        { width: 320, height: 50, label: '320x50 - Mobile Leaderboard', isDefault: false, enabled: true },
        { width: 320, height: 100, label: '320x100 - Large Mobile Banner', isDefault: false, enabled: true },
        { width: 300, height: 600, label: '300x600 - Half Page', isDefault: false, enabled: true },
        { width: 336, height: 280, label: '336x280 - Large Rectangle', isDefault: false, enabled: true },
        { width: 468, height: 60, label: '468x60 - Banner', isDefault: false, enabled: true }
      ]
    };
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(
      'system_config',
      JSON.stringify(defaultSettings),
      new Date().toISOString()
    );
  }

  // Seed default Hocalwire CMS Partner if not existing
  try {
    const federalPartner: any = db.prepare('SELECT id FROM cms_partners WHERE id = ?').get('partner_the_federal_staging');
    if (!federalPartner) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO cms_partners (
          id, name, cms_type, endpoint, api_path, security_token, auto_sync_campaigns, auto_sync_ad_units, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'partner_the_federal_staging',
        'The Federal (Hocalwire Staging)',
        'HOCALWIRE',
        'stagingfederalsite.hocalwire.in',
        '/dev/h-api/news',
        '1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG',
        1,
        1,
        1,
        now,
        now
      );
    } else {
      // Ensure endpoint and token match latest specification
      db.prepare(`
        UPDATE cms_partners 
        SET api_path = ?, security_token = ?, endpoint = ?
        WHERE id = ? OR endpoint LIKE '%stagingfederalsite.hocalwire.in%'
      `).run(
        '/dev/h-api/news',
        '1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG',
        'stagingfederalsite.hocalwire.in',
        'partner_the_federal_staging'
      );
    }
  } catch (err) {
    console.error('Error seeding default CMS partner:', err);
  }

  // Migrations: add columns that may not exist in older DB versions
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN gam_advertiser_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN custom_name TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN cms_sync_status TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN cms_synced_at TEXT`); } catch {}
  try { db.exec(`UPDATE campaigns SET network_code = '22068249324' WHERE network_code IS NULL OR network_code = ''`); } catch {}

  // Seed partner-specific ad units if needed
  try {
    const now = new Date().toISOString();
    const defaultAdUnits = [
      // Blinkcorp Technologies (22068249324)
      { id: 'ADU-blink-01', name: 'Blink Homepage 300x250', code: 'blink_homepage_300x250', networkCode: '22068249324', sizes: [{ width: 300, height: 250 }] },
      { id: 'ADU-blink-02', name: 'Blink Leaderboard 728x90', code: 'blink_leaderboard_728x90', networkCode: '22068249324', sizes: [{ width: 728, height: 90 }] },
      // The Federal (22665183713)
      { id: 'ADU-fed-01', name: 'The Federal Header 970x90', code: 'thefederal_header_970x90', networkCode: '22665183713', sizes: [{ width: 970, height: 90 }] },
      { id: 'ADU-fed-02', name: 'The Federal Homepage 728x90', code: 'thefederal_homepage_728x90', networkCode: '22665183713', sizes: [{ width: 728, height: 90 }] },
      { id: 'ADU-fed-03', name: 'The Federal Mobile HP 320x50', code: 'thefederal_hp_320x50', networkCode: '22665183713', sizes: [{ width: 320, height: 50 }] },
      { id: 'ADU-fed-04', name: 'The Federal Category 250x250', code: 'thefederal_cat_250x250', networkCode: '22665183713', sizes: [{ width: 250, height: 250 }] },
      // Default Global Ad Unit (Admin Only)
      { id: 'ADU-global-default', name: 'Global Default Slot 300x250', code: 'global_default_slot_300x250', networkCode: null, sizes: [{ width: 300, height: 250 }] }
    ];
    for (const unit of defaultAdUnits) {
      const existing: any = db.prepare('SELECT id FROM ad_units WHERE code = ?').get(unit.code);
      if (!existing) {
        db.prepare(`
          INSERT INTO ad_units (id, name, code, google_ad_unit_id, parent_google_ad_unit_id, sizes, status, network_code, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(unit.id, unit.name, unit.code, null, null, JSON.stringify(unit.sizes), 'ACTIVE', unit.networkCode, now, now);
      } else if (unit.networkCode) {
        db.prepare('UPDATE ad_units SET network_code = ? WHERE code = ?').run(unit.networkCode, unit.code);
      }
    }

    // Map historical ad units created during campaigns to their matching partner networks
    db.prepare("UPDATE ad_units SET network_code = '22212039110' WHERE (code LIKE 'newstrack_%' OR code LIKE 'godad_%') AND (network_code IS NULL OR network_code = '')").run();
    db.prepare("UPDATE ad_units SET network_code = '22671723195' WHERE code LIKE 'pappu_%' AND (network_code IS NULL OR network_code = '')").run();
    db.prepare("UPDATE ad_units SET network_code = '310443190' WHERE code LIKE 'hans_%' AND (network_code IS NULL OR network_code = '')").run();
    db.prepare("UPDATE ad_units SET network_code = '22068249324' WHERE (code LIKE 'aaaaaaa_%' OR code LIKE 'testing_%') AND (network_code IS NULL OR network_code = '')").run();
  } catch (err) {
    console.error('Error seeding default ad units:', err);
  }

  // Seed partner-specific advertisers if needed
  try {
    const now = new Date().toISOString();
    // Clean up any unmapped legacy advertisers so they don't bleed across partners
    db.prepare("UPDATE advertisers SET network_code = '22068249324' WHERE network_code IS NULL OR network_code = ''").run();

    const defaultAdvertisers = [
      // Blinkcorp Technologies (22068249324)
      { id: 'ADV-6156180870', name: 'ABHishke', googleAdvertiserId: '6156180870', networkCode: '22068249324' },
      { id: 'ADV-6074141268', name: 'Assam Tribune', googleAdvertiserId: '6074141268', networkCode: '22068249324' },
      { id: 'ADV-5225386500', name: 'hocalwire', googleAdvertiserId: '5225386500', networkCode: '22068249324' },
      { id: 'ADV-6155963446', name: 'TechStar Brand', googleAdvertiserId: '6155963446', networkCode: '22068249324' },
      { id: 'ADV-5881247959', name: 'Mpost', googleAdvertiserId: '5881247959', networkCode: '22068249324' },
      { id: 'ADV-6126803745', name: 'Pratahkal', googleAdvertiserId: '6126803745', networkCode: '22068249324' },
      { id: 'ADV-5880174211', name: 'shamim', googleAdvertiserId: '5880174211', networkCode: '22068249324' },
      { id: 'ADV-5247096423', name: 'srgd', googleAdvertiserId: '5247096423', networkCode: '22068249324' },

      // The Federal (22665183713)
      { id: 'ADV-fed-01', name: 'The Federal Sponsor', googleAdvertiserId: '6156180871', networkCode: '22665183713' },
      { id: 'ADV-fed-02', name: 'Federal National Brands', googleAdvertiserId: '6156180872', networkCode: '22665183713' },
      { id: 'ADV-fed-03', name: 'Federal Retail Agency', googleAdvertiserId: '6156180873', networkCode: '22665183713' },
      { id: 'ADV-fed-04', name: 'Hocalwire Media', googleAdvertiserId: '6156180874', networkCode: '22665183713' },
      { id: 'ADV-fed-05', name: 'Google Marketing', googleAdvertiserId: '5234810863', networkCode: '22665183713' },

      // News Track (22212039110)
      { id: 'ADV-nt-01', name: 'Newstrack', googleAdvertiserId: '5236392682', networkCode: '22212039110' },
      { id: 'ADV-nt-02', name: 'Google', googleAdvertiserId: '5234810863', networkCode: '22212039110' },
      { id: 'ADV-nt-03', name: 'Indian Navy', googleAdvertiserId: '5121434345', networkCode: '22212039110' },
      { id: 'ADV-nt-04', name: 'UK Govt', googleAdvertiserId: '5040669480', networkCode: '22212039110' },
      { id: 'ADV-nt-05', name: 'UP Government', googleAdvertiserId: '4958395134', networkCode: '22212039110' },

      // new powergame (22827981500)
      { id: 'ADV-npg-01', name: 'CG Samvad', googleAdvertiserId: '5264533411', networkCode: '22827981500' },
      { id: 'ADV-npg-02', name: 'Govt. Ads', googleAdvertiserId: '5640784962', networkCode: '22827981500' },
      { id: 'ADV-npg-03', name: 'NPG ad', googleAdvertiserId: '5849475494', networkCode: '22827981500' },

      // Hyderabad Media House (310443190)
      { id: 'ADV-hmh-01', name: 'HANS', googleAdvertiserId: '4151784030', networkCode: '310443190' },
      { id: 'ADV-hmh-02', name: 'Amazon', googleAdvertiserId: '4911553386', networkCode: '310443190' },
      { id: 'ADV-hmh-03', name: 'Google AdSense', googleAdvertiserId: '5078249509', networkCode: '310443190' },
      { id: 'ADV-hmh-04', name: 'HMHL', googleAdvertiserId: '5616289601', networkCode: '310443190' },
      { id: 'ADV-hmh-05', name: 'HMTV', googleAdvertiserId: '4241615430', networkCode: '310443190' },
      { id: 'ADV-hmh-06', name: 'Maruti', googleAdvertiserId: '5138775079', networkCode: '310443190' }
    ];
    for (const adv of defaultAdvertisers) {
      const existing: any = db.prepare('SELECT id FROM advertisers WHERE name = ?').get(adv.name);
      if (!existing) {
        db.prepare(`
          INSERT INTO advertisers (id, name, google_advertiser_id, status, network_code, created_at, updated_at)
          VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
        `).run(adv.id, adv.name, adv.googleAdvertiserId, adv.networkCode, now, now);
      } else {
        db.prepare('UPDATE advertisers SET network_code = ?, google_advertiser_id = ? WHERE id = ?')
          .run(adv.networkCode, adv.googleAdvertiserId, existing.id);
      }
    }
  } catch (err) {
    console.error('Error seeding default advertisers:', err);
  }
}
