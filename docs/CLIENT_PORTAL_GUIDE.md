# Blink CMS • Google Ad Manager Automation Platform
## Client Onboarding & Portal Operating Guide (Client Prospective)

---

### Welcome to Blink CMS Ad Automation
**Prepared For:** Assam Tribune Operations & Trafficking Team  
**Authorized Account:** `dfp@assamtribune.com`  
**Assigned Partner Network:** Blinkcorp Technologies Private Limited (`22068249324`)  
**Assigned Advertiser Scope:** Assam Tribune (`ADV-6074141268`)  
**Document Version:** 2.0 (Multi-Device & Partner Scoped Edition)  

---

## 1. Executive Summary & Value Proposition

The **Blink CMS Google Ad Manager (GAM) Automation Platform** transforms how digital publishers and advertisers traffic, schedule, and deliver direct advertising campaigns. Traditionally, booking a multi-size sponsorship or standard campaign in Google Ad Manager (DFP) requires over **15 to 25 manual clicks per creative size** across orders, line items, creative libraries, ad unit targeting, and line item creative associations (LICA).

With the Blink CMS Automation Platform:
- **Instant 10-Second Booking**: Upload a banner asset, choose flight dates, and the automated saga provisions the Google Order, Line Item, Creative, and LICA via secure Google SOAP APIs in real time.
- **Zero Human Error**: Naming conventions, start/end date alignments, CPM rates, and ad unit inventory mappings are strictly validated and automated.
- **Multi-Format Auto-Resizing**: Upload a single high-resolution banner, and the integrated engine automatically generates standard IAB sizes (`300x250`, `728x90`, `300x600`, `320x50`, `970x250`, `970x90`).
- **Complete Enterprise Data Isolation**: Your account is scoped strictly to **Assam Tribune**. You only see your inventory, campaigns, and creatives with complete privacy and zero data leakage.
- **Seamless CMS Integration**: 1-click push to publish GPT tags and ad slot containers directly into the Hocalwire CMS.
- **Responsive Across All Devices**: Native support for smartphones, tablets, laptops, and ultra-wide desktop monitors.

---

## 2. Access Credentials & Account Setup

### 2.1 Login Information

| Parameter | Assam Tribune Credential |
| :--- | :--- |
| **Portal Web Access** | `http://localhost:5173` *(or your company's production portal URL)* |
| **User Email** | `dfp@assamtribune.com` |
| **Initial Password** | `pass123` |
| **User Role** | `trafficker` (Partner & Advertiser Scoped) |
| **Network Scope** | `22068249324` (Blinkcorp Technologies Private Limited) |
| **Advertiser Account** | `Assam Tribune` (`ADV-6074141268`) |

> [!IMPORTANT]
> **First-Time Login Security**: Upon your first login with the default temporary password (`pass123`), the portal will prompt you to set a confidential, personal password. Passwords are cryptographically hashed using salted `scrypt` hashing and are never visible to system operators.

### 2.2 Security & Data Privacy Guarantees
- **Strict Role-Based Scoping**: Your account has access only to **Assam Tribune** campaigns and inventory. Administrative controls (such as global network API keys, SOAP transaction logs, and global billing settings) are strictly hidden and guarded against unauthorized access.
- **Audit Logging**: Every campaign creation, creative update, pause, or resume action is logged with your user identifier (`dfp@assamtribune.com`) for tracking and compliance.

---

## 3. Platform Tour & Navigation

The platform features an intuitive, responsive navigation layout that adapts to whether you are using a mobile phone, tablet, or desktop computer.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚡ BlinkCMS Google Ad Manager        [Assam Tribune (22068249324)]  👤 │
├────────────────────────────────────────────────────────────────────────┤
│  [Dashboard]   [Campaigns]   [Ad Units Inventory]   [Advertisers]      │
└────────────────────────────────────────────────────────────────────────┘
```

### Navigation Modules
1. **Dashboard**: High-level bird's-eye view showing total active campaigns, running line items, ad unit inventory, and recent bookings.
2. **Campaigns**: Complete listing of all Assam Tribune ad bookings, real-time status badges, flight dates, and quick management controls.
3. **Ad Units Inventory**: Catalogue of all Google Ad Manager inventory slots provisioned for Assam Tribune (e.g. Header Leaderboard, MREC Sidebar, Sticky Anchor).
4. **Advertisers**: Directory of verified Google Ad Manager advertiser companies mapped to your network.

---

## 4. Step-by-Step User Guides

### Guide 1: How to Create a New Campaign in 60 Seconds

1. **Open Campaign Creator**: Click the **"+ Create Campaign"** button from either the Top Bar, Dashboard, or Campaigns page.
2. **Verify Account & Network Scope**:
   - The creator banner will display: `Creating Account: Assam Tribune (dfp@assamtribune.com)`.
   - Your partner network (`22068249324`) and advertiser (`Assam Tribune`) are locked in to prevent booking errors.
3. **Enter Campaign Details**:
   - **Campaign Custom Name** *(Optional)*: e.g. `Assam Tribune Festival Festive Sale 2026`.
   - **Target Landing Page URL**: Enter the destination link (e.g. `https://assamtribune.com/special-offer`). Must begin with `https://`.
4. **Select Flight Dates**:
   - **Start Date & Time**: When the ad should begin serving.
   - **End Date & Time**: When the ad should stop serving.
5. **Upload Banner Creative & Auto-Resize**:
   - Drag & drop or select your primary banner image (`PNG`, `JPG`, or `WebP`).
   - The portal's built-in intelligent canvas resizer generates all required IAB formats instantly:
     - `300x250` (Medium Rectangle / MREC)
     - `728x90` (Desktop Leaderboard)
     - `300x600` (Half Page / Monster Ad)
     - `320x50` (Mobile Smartphone Anchor)
     - `970x250` (Billboard / Super Leaderboard)
   - You can toggle individual sizes on or off depending on the client's package.
6. **Submit Campaign**:
   - Click **"Launch Campaign"**.
   - The automated orchestration engine executes the **6-Step Google Ad Manager Saga**:
     ```
     [1. Validate Assets] ➔ [2. Create GAM Order] ➔ [3. Book Line Item] 
                          ➔ [4. Upload Creatives] ➔ [5. Associate LICA] ➔ [6. READY]
     ```
   - In less than 10 seconds, the status turns green: **READY**. The campaign is live in Google Ad Manager!

---

### Guide 2: Managing & Updating Active Campaigns

#### Pausing and Resuming Campaigns
- Open any campaign from the **Campaigns** tab.
- Click **"Pause"** to immediately suspend ad serving in Google Ad Manager.
- Click **"Resume"** to restart delivery instantly.

#### Mid-Flight Bulk Banner Swapping
Need to replace an outdated creative with a new offer banner without rebuilding the campaign?
1. In the **Campaigns** list or on the **Campaign Details** page, click **"Upload Banners"** (or the Cloud Upload icon).
2. Select your replacement image.
3. The platform replaces the creative in Google Ad Manager across all associated line items automatically.

---

### Guide 3: CMS & DFP Tag Push (Hocalwire Integration)

The platform bridges the gap between Google Ad Manager and your website CMS (such as Hocalwire).

1. On the **Campaign Details** page, locate the **"Sync to Partner CMS"** button.
2. Clicking this triggers an automated webhook push to the configured Hocalwire CMS staging or production endpoints.
3. The CMS receives:
   - Google Ad Manager Slot Path (e.g., `/22068249324/assamtribune_web_mrec_300x250`)
   - Google Publisher Tag (GPT) `<head>` script definitions with asynchronous targeting.
   - GPT `<body>` container `<div>` tags ready for placement inside article pages or homepage blocks.
4. If manual tag placement is preferred, click **"Generate GPT Code"** to view and copy the code snippets with one click.

---

## 5. Multi-Device Experience (Mobile, Tablet, Desktop)

The Blink CMS interface has been designed with responsive layouts:

| Device Category | Screen Resolution | Experience Highlights |
| :--- | :--- | :--- |
| **Mobile Phones** | `320px – 640px` (iPhone, Android) | Clean touch card layout, no horizontal table scrolling, thumb-friendly tap targets, adaptive top menu. |
| **Tablets** | `641px – 1024px` (iPad, Galaxy Tab) | Compact 2-column metrics grid, adaptive filters, quick-action drawers. |
| **Desktop / Laptops**| `1024px – 2560px` | High-density data tables, side-by-side workflow stepper, instant preview monitors. |

---

## 6. Frequently Asked Questions (FAQ)

#### Q1: What happens if an image does not meet standard DFP dimensions?
**Answer:** The portal features built-in client-side aspect-ratio correction and scaling. If you upload a square or oversized graphic, it adapts and scales to the required ad dimensions while preserving visual clarity.

#### Q2: Can campaigns be booked in "Dry Run" test mode?
**Answer:** Yes! When creating a campaign, checking the **"Dry Run Mode"** checkbox simulates the complete booking workflow and generates mock Google IDs without affecting live impression delivery or inventory counts in your live Google Ad Manager network.

#### Q3: Why can't I see network configuration or API logs?
**Answer:** To ensure stability and security, server-level settings and SOAP transaction logs are reserved for system administrators. Traffickers and publisher clients receive a clean, focused portal dedicated to inventory, campaign creation, and creative delivery.

#### Q4: What should I do if a campaign shows status `FAILED`?
**Answer:** The portal provides automatic failure diagnostic messages. Simply review the error notice (e.g., target URL unreachable or flight date in the past), adjust the setting, and click **"Retry"**. The platform resumes from the exact step that failed without creating duplicate orders.

---

## 7. Client Support & Contact

If you require new ad unit formats, custom targeting setups, or operational assistance:
- **Technical Support Email**: `support@blinkcorp.com`
- **Partner Operations Desk**: Available Mon–Sat, 9:00 AM – 7:00 PM IST
- **Emergency Escalation**: Please contact your designated Blinkcorp Partner Account Manager.

---

*© 2026 Blinkcorp Technologies Private Limited. All rights reserved. Google Ad Manager and DFP are trademarks of Google LLC.*
