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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default admin user if no users exist
  try {
    const userCount: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('Admin@12345', salt, 64).toString('hex');
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, salt, role, avatar, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'usr_admin_001',
        'Administrator',
        'admin@gam.io',
        hash,
        salt,
        'admin',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop',
        now,
        now
      );
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
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
      defaultLineItemType: 'STANDARD',
      defaultPriority: 8,
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

  // Migrations: add columns that may not exist in older DB versions
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN network_code TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN gam_advertiser_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE campaigns ADD COLUMN custom_name TEXT`); } catch {}
}
