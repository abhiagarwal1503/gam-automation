# Google Ad Manager (GAM) Campaign & Creative Enhancement Specification
## Unified Product Requirements Document (PRD) & Technical Specification

**Document Version:** 2.0 (Merged & Corrected Edition)  
**Target API:** Google Ad Manager API (SOAP v2024xx / v202511)  
**Scope:** Campaign Creation, Line Item Configuration, Multi-Type Creative Management, Proportional Canvas Resizing Engine, Pre-Flight Validation & Error Diagnostics

---

## Executive Summary & System Overview

This specification consolidates and corrects all operational and technical requirements for the **Google Ad Manager Campaign & Creative Management Module**. 

The system transitions from single-card static creative handling to a robust, enterprise-grade creative management pipeline supporting:
1. **Dynamic Line Item Configuration** with automated default to `SPONSORSHIP (Priority 4)` and API-governed types.
2. **Polymorphic Creative Types** supporting Google Ad Manager concrete creative classes: `ImageCreative`, `Html5Creative`, `ThirdPartyCreative`, `InternalRedirectCreative` (CM360), `CustomCreative`, and `TemplateCreative` (Native).
3. **Proportional "Contain" Canvas Engine** that completely eliminates destructive image cropping, guarantees zero distortion, preserves the original uploaded master asset, and pads letterbox/pillarbox areas to exact IAB slot dimensions.
4. **Batch Multi-Size Generation & Synchronized LICA**: 1-click generation of multiple standard ad formats from a single master asset, with instant preview, individual size toggling, and automatic Line Item Creative Association (`LICA`).
5. **Pre-Flight Validation, Dry-Run Simulation & Granular SOAP Error Diagnostics**.

```
                           ┌──────────────────────────────────────────────────┐
                           │            Campaign & Creative Creator           │
                           │  - Line Item Type: SPONSORSHIP (Priority 4)      │
                           │  - Creative Type: Image / HTML5 / 3rd-Party / etc│
                           └────────────────────────┬─────────────────────────┘
                                                    │
                                  ┌─────────────────┴─────────────────┐
                                  ▼                                   ▼
                       [ Image Upload / URL ]               [ HTML5 / 3rd Party ]
                                  │                                   │
                                  ▼                                   │
                      ┌───────────────────────┐                       │
                      │ Contain Resizing Core │                       │
                      │  - Scale: min(W, H)   │                       │
                      │  - Centered & Padded  │                       │
                      │  - Strict Exact Size  │                       │
                      └───────────┬───────────┘                       │
                                  │                                   │
                                  ▼                                   │
                      ┌───────────────────────┐                       │
                      │ Multi-Size Preview UI │◄──────────────────────┘
                      │ (300x250, 728x90,etc) │
                      └───────────┬───────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ Pre-Flight / Dry Run  │
                      │ Validation Inspector  │
                      └───────────┬───────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ Google Ad Manager API │
                      │ Order -> Line Item -> │
                      │ Creative -> LICA      │
                      └───────────────────────┘
```

---

## 1. Line Item Configuration & Network Types

### 1.1 Default Line Item Configuration
* **Default Type Selection**: When initiating a new campaign or line item, the system must automatically select:
  **`SPONSORSHIP` (Priority 4)**.
* **Manual Override**: Users must be able to switch to other supported Line Item types via a clean dropdown.
* **GAM Technical Corrections Applied**:
  * In Google Ad Manager SOAP API (`LineItemService`), setting `lineItemType = 'SPONSORSHIP'` requires specific field rules:
    1. **Priority**: Locked to `4` (the GAM standard for Sponsorship).
    2. **Primary Goal**: Must use `unitType: 'IMPRESSIONS'` with `goalType: 'DAILY'` or `goalType: 'NONE'` and `units: 100` representing **100% Share of Voice (SOV)**. GAM rejects absolute impression caps (e.g. 50,000 impressions) for Sponsorship line items.
    3. **Cost Type**: Defaults to `CPM` or `CPD` (Cost Per Day).
  * When switched to **`STANDARD`**:
    1. **Priority**: Locked to `8` (or `6`/`10` based on network settings).
    2. **Primary Goal**: `goalType: 'LIFETIME'` or `'DAILY'`, with explicit impression units (e.g., `units: 100000`).
    3. **Cost Type**: `CPM` or `CPC`.

### 1.2 Line Item Type Dropdown & API Validation
The dropdown dynamically displays types permitted by the authenticated Google Ad Manager network:

| Line Item Type | Default Priority | Goal Type | Units / Delivery Behavior |
| :--- | :---: | :---: | :--- |
| **Sponsorship** *(Default)* | **4** | Daily / Percentage | 100% Share of Voice (Guaranteed) |
| **Standard** | **8** | Lifetime / Daily | Fixed Impression Count (Guaranteed) |
| **Network** | **12** | Percentage | Specific % of non-guaranteed remnant |
| **Bulk** | **12** | Lifetime | Fixed impressions, lower priority than Standard |
| **Price Priority** | **12** | None | Competes dynamically on Net CPM with Ad Exchange |
| **House** | **16** | None | Fallback ad units when no paying ads match |
| **Ad Exchange** | **12** | None | Network AdX dynamic allocation (if enabled) |
| **Preferred Deal** | **12** | None | Programmatic Direct buyer deals (requires Buyer ID) |
| **Programmatic Guaranteed** | **4** | Lifetime | Programmatic Direct guaranteed (requires Deal ID) |

> [!IMPORTANT]
> The UI must not display hard-coded unsupported programmatic types (`PREFERRED_DEAL`, `PROGRAMMATIC_GUARANTEED`) if the connected GAM Network does not have Programmatic Direct features enabled.

---

## 2. Dynamic Creative Type Selector

Replace static, fragmented creative card pickers with a unified **Creative Type Dropdown**.

### 2.1 Supported Types & Defaults
* **Default Selected Value**: **`Image`**
* **Available Options**:
  1. `Image` (`ns:ImageCreative`)
  2. `HTML5` (`ns:Html5Creative`)
  3. `Third Party` (`ns:ThirdPartyCreative`)
  4. `Campaign Manager 360` (`ns:InternalRedirectCreative` / `ImageRedirectCreative`)
  5. `Custom` (`ns:CustomCreative`)
  6. `Native Format` (`ns:TemplateCreative`)
* **Dynamic Form Rendering**: Selecting a creative type dynamically renders its dedicated configuration pane without refreshing the page or losing campaign-level metadata (Advertiser, Dates, Network).

---

## 3. Image Creative Management

When **Creative Type = Image** is active:

### 3.1 Asset Input Methods
* **Single Ingestion Mode**:
  * **Direct Local File Upload**: Drag-and-drop or file browser selection from local disk.
  * *(Note: Remote HTTP/HTTPS Image URL ingestion is explicitly removed/disallowed for security and asset integrity).*
* **Supported File Formats**:
  * `image/jpeg` (`.jpg`, `.jpeg`)
  * `image/png` (`.png`)
  * `image/gif` (`.gif` — including animated GIF frame preservation)
  * `image/webp` (`.webp` — with automated client-side fallback/transcode to PNG if target network or ad environment requires legacy compatibility).
* **Asset Replacement & Teardown**:
  * 1-click **Replace Asset** button to swap master banners.
  * 1-click **Remove Asset** button to clear the current buffer.

### 3.2 Master Asset Metadata Inspection
Immediately upon asset selection, the UI extracts and displays:
* **Original Dimensions**: e.g., `1200 × 628 px`
* **Aspect Ratio**: e.g., `1.91:1 (Landscape)`
* **MIME Format**: e.g., `PNG` / `JPEG`
* **File Size**: e.g., `245 KB` (with green/amber warning if exceeding 150KB IAB initial load guidelines)

---

## 4. Multi-Size Ad Slot Selection & Batch Pipeline

The system enables selecting multiple standard IAB ad dimensions for a single campaign.

### 4.1 Standard Ad Dimensions
Default multi-select checkboxes include:
* ☑ `300 × 250` — Medium Rectangle (MREC / In-Article / Sidebar)
* ☑ `728 × 90` — Desktop Leaderboard (Top / Footer)
* ☑ `320 × 50` — Mobile Smartphone Banner (Sticky Anchor)
* ☐ `300 × 600` — Half Page / Monster Ad
* ☐ `970 × 250` — Billboard / Super Leaderboard
* ☐ `320 × 100` — Large Mobile Banner
* ☐ `336 × 280` — Large Rectangle

The user can select any combination (e.g., all mobile + desktop sizes).

---

## 5, 6 & 7. Contain / Fit Resizing Engine (Zero-Crop Guarantee)

### 5.1 The Core Problem & Elimination of Cropping
Legacy systems used CSS/Canvas `cover` cropping, cutting off logos, phone numbers, headlines, and advertiser disclaimers when converting landscape banners (e.g., 1200x628) into square (300x250) or skyscraper (300x600) slots.

### 5.2 Mandatory Contain Resizing Algorithm
* **Zero Cropping**: Never slice or discard pixels from the source image.
* **Aspect Ratio Integrity**: Scale the source image uniformly without stretching or distorting.
* **Proportional Scaling Formula**:
  Given target slot dimensions $(W_t, H_t)$ and source image dimensions $(W_s, H_s)$:
  $$\text{Scale Factor } S = \min\left(\frac{W_t}{W_s}, \frac{H_t}{H_s}\right)$$
  $$\text{Rendered Width } W_r = \text{round}(W_s \times S)$$
  $$\text{Rendered Height } H_r = \text{round}(H_s \times S)$$
  $$\text{Offset } X = \text{round}\left(\frac{W_t - W_r}{2}\right)$$
  $$\text{Offset } Y = \text{round}\left(\frac{H_t - H_r}{2}\right)$$
* **Canvas Output Dimensions**: The generated canvas is strictly $(W_t, H_t)$, centering the rendered image at $(X, Y)$.
* **GAM API Compliance**: Google Ad Manager strictly enforces that `ImageCreative.primaryImageAsset` width and height in pixels **must exactly match** `Creative.size`. The contain canvas guarantees 100% compliance.

```
Target Canvas: 300 × 250 (Target Ratio 1.2:1)
Source Asset: 1200 × 628 (Source Ratio 1.91:1)

┌──────────────────────────────────────────────┐
│  Letterbox Padding (Top: ~46px)              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │      ORIGINAL BANNER UNTOUCHED         │  │
│  │     (300px × 157px, 100% visible)      │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│  Letterbox Padding (Bottom: ~47px)           │
└──────────────────────────────────────────────┘
```

### 5.3 Background & Padding Styling
* **Default Fill**: Crisp Studio White (`#FFFFFF`) or Transparent (for transparent PNG assets).
* **Configurable Fill Options**:
  * `Solid White` (`#FFFFFF`) — Standard for white background sites.
  * `Solid Black` (`#000000`) — Standard for dark mode slots.
  * `Transparent` (`image/png` export) — Seamless integration on any site theme.
  * `Smart Palette Sample` — Auto-samples the peripheral edge pixel of the original image to create a seamless background extension.
* **Rendering Quality**: High-quality bicubic smoothing enabled (`ctx.imageSmoothingQuality = 'high'`).

---

## 8. Multi-Size Interactive Visual Preview

Before pushing to Google Ad Manager, the portal renders an interactive preview suite.

### 8.1 Preview Features
* **Master Asset Card**: Displays the original unresized file.
* **Interactive Size Tabs / Grid**: Side-by-side or tabbed inspection of all selected sizes (`300x250`, `728x90`, `320x50`, etc.).
* **Per-Size Metadata Badge**:
  * Exact canvas dimensions
  * Rendered image dimensions and padding offsets
  * Output compressed file size in KB
* **Live Click Simulation**: Clicking the preview tests destination URL redirection in a new sandboxed tab.
* **Per-Size Customization**:
  * Ability to override the creative name for an individual size.
  * Ability to exclude a specific size from the batch push without deselecting others.

---

## 9. Destination Click URL & Landing Page Security

* **Target Destination URL Input**: Required field for Image creatives.
* **Validation Rules**:
  * Strictly validated URL regex with protocol (`http://` or `https://`).
  * `https://` enforced or strongly warned for secure browsing.
  * Query parameters and tracking UTM strings preserved (`utm_source`, `utm_campaign`).
* **Target Window Setting**:
  * `_blank` (New Window / Tab) — **Default**
  * `_top` (Open in Current Frame / Page)

---

## 10. Creative Naming Conventions & Auto-Generation

The platform eliminates naming discrepancies by auto-generating standardized GAM creative names:

### 10.1 Default Formula
```text
{AdvertiserName} - {CreativeType} - {Width}x{Height}
```
*Example for Assam Tribune batch booking:*
* `Assam Tribune - Image - 300x250`
* `Assam Tribune - Image - 728x90`
* `Assam Tribune - Image - 320x50`

### 10.2 Customization
* Users can provide a custom campaign prefix (e.g. `SpringSale2026`).
* Individual creative names remain fully editable prior to submission.

---

## 11. HTML5 Creative Specification

When **Creative Type = HTML5**:

### 11.1 ZIP Package Ingestion & Verification
* **Upload**: Drag-and-drop `.zip` archive.
* **Client-Side ZIP Parsing** (via JSZip or backend validation):
  * Verifies valid ZIP structure.
  * Enforces presence of root `index.html`.
  * Inspects embedded asset types (`.js`, `.css`, `.png`, `.jpg`, `.svg`, `.json`).
  * Validates total uncompressed file size (within GAM limits, typically ≤ 2.2 MB).
* **ClickTag Inspection**:
  * Scans `index.html` for standard clickTag macros:
    ```javascript
    window.open(window.clickTag || "https://example.com", "_blank");
    ```
  * If clickTag is missing, displays an advisory warning and allows providing a fallback click-through URL.
* **Live Sandbox Preview**: Renders the HTML5 bundle inside an isolated iframe sandbox (`sandbox="allow-scripts"`) for visual verification.

---

## 12. Third-Party Creative Specification

When **Creative Type = Third Party**:

### 12.1 Configuration Fields
* **Third-Party Code Snippet**: Multi-line syntax-highlighted code editor for HTML/JavaScript ad tags (e.g. DoubleClick, Google AdSense, OpenX, PubMatic, IAS, DoubleVerify).
* **SafeFrame Compatibility Toggle**:
  * `Serve in SafeFrame`: Checkbox (Default: `true`).
  * If the ad tag uses busting techniques or needs host DOM access, user can uncheck.
* **Creative Size Selector**: Dropdown to select target dimension (e.g. `300x250`).
* **Click-Tracking Macro Insertion**: Convenient helper button to insert Google Ad Manager tracking macros into the snippet:
  * `%%CLICK_URL_UNESC%%`
  * `%%CLICK_URL_ESC%%`
  * `%%CACHEBUSTER%%`

---

## 13. Campaign Manager 360 (CM360) Creative

When **Creative Type = Campaign Manager 360**:

### 13.1 Configuration Fields
* **Campaign Manager Tag / Redirect URL**: Input field for DCM internal redirect URL (e.g., `https://ad.doubleclick.net/ddm/trackimp/...`).
* **Target Size**: Dropdown selection matching the CM360 placement size.
* **GAM Mapping**: Configured in GAM as `InternalRedirectCreative` for seamless ad serving without double billing or latency.

---

## 14. Custom Creative Specification

When **Creative Type = Custom**:

### 14.1 Configuration Fields
* **Custom HTML/JavaScript Snippet**: Code editor supporting custom scripts, rich media overlays, or interactive lead-gen widgets.
* **Target Size**: Specific width and height.
* **Associated File Assets**: Option to upload companion image/script assets referenced via `file:` macros.

---

## 15. Native Format Specification

When **Creative Type = Native Format**:

### 15.1 Dynamic Native Field Renderer
The UI dynamically renders native content blocks based on the selected Native Template:
* **Headline** *(Max 25 or 90 chars)*
* **Body Text** *(Max 90 chars)*
* **Main Marketing Image** *(1200 × 627 px recommended)*
* **Square Brand Logo** *(1:1 ratio, 300 × 300 px recommended)*
* **Call to Action** *(e.g., "Learn More", "Shop Now", "Book Today")*
* **Landing Page Destination URL**
* **Advertiser Name / Byline**

---

## 16. Comprehensive Pre-Flight Validation Matrix

Before communicating with the Google Ad Manager SOAP endpoints, the engine executes a three-tiered validation:

```
[ Tier 1: Client-Side Input Validation ]
                  ↓ (PASS)
[ Tier 2: Pre-Flight Asset & Policy Inspection ]
                  ↓ (PASS)
[ Tier 3: Dry-Run GAM SOAP Simulation ]
                  ↓ (PASS)
[ Live Push to Google Ad Manager ]
```

### Validation Rules Summary

| Category | Checks Performed | Error Severity |
| :--- | :--- | :--- |
| **Line Item** | Type selected (`SPONSORSHIP`), dates not in past, end date > start date | Blocking |
| **Image Asset** | Canvas rendered, non-empty blob, dimensions match target size | Blocking |
| **Landing URL** | Valid URL syntax, HTTPS scheme, host reachable | Blocking / Warning |
| **HTML5** | Valid ZIP, `index.html` present, assets within file size limit | Blocking |
| **Third-Party** | Snippet non-empty, script tags balanced, macros valid | Blocking |
| **Inventory** | Ad units exist for all selected creative sizes in target network | Blocking |

---

## 17. Google Ad Manager API Object Mapping & Architecture

The backend orchestrates calls across official GAM SOAP v202511 services:

```
Campaign Input
      │
      ├─► CompanyService.getCompaniesByStatement / createCompanies
      │   (Ensures Advertiser ADV-xxx exists)
      │
      ├─► InventoryService.getAdUnitsByStatement
      │   (Validates / fetches Ad Unit matching site, position, size)
      │
      ├─► OrderService.createOrders
      │   (Provisions GAM Order: name, advertiserId, traffickerId)
      │
      ├─► LineItemService.createLineItems
      │   (Provisions LineItem: lineItemType='SPONSORSHIP', priority=4,
      │    flight dates, targeting adUnitId, multi-size placeholders)
      │
      ├─► CreativeService.createCreatives (Polymorphic xsi:type)
      │   ├── xsi:type="ns:ImageCreative"
      │   ├── xsi:type="ns:Html5Creative"
      │   ├── xsi:type="ns:ThirdPartyCreative"
      │   └── xsi:type="ns:InternalRedirectCreative"
      │
      └─► LineItemCreativeAssociationService.createLineItemCreativeAssociations
          (Links each generated Creative to the Line Item with size matching)
```

### Critical API Mapping Correction:
In Google Ad Manager, a creative is not active until a **LICA (`LineItemCreativeAssociation`)** is created. When generating multiple sizes:
1. The `LineItem` is created with `creativePlaceholders` for each selected size (`300x250`, `728x90`, `320x50`).
2. Each resized asset is created as an independent `ImageCreative`.
3. An array of `LineItemCreativeAssociation` objects is submitted linking each `creativeId` to the `lineItemId` with matching `sizes`.

---

## 18. Multi-Creative Batch Generation Flow

When the user selects **Creative Type = Image** with **3 sizes** (`300x250`, `728x90`, `320x50`):
1. **Canvas Pipeline**: Generates 3 discrete base64/blob image payloads using the proportional Contain engine.
2. **Creative Service Call**: Submits a batch SOAP XML payload to `CreativeService.createCreatives` containing 3 `ImageCreative` nodes.
3. **Association Service Call**: Submits 3 `LineItemCreativeAssociation` objects linking each creative to the order's line item.
4. **Result Storage**: Stores all 3 Google Creative IDs and LICA IDs in the database linked to the campaign record.

---

## 19. Dry-Run Mode vs Live Execution

The interface provides a dedicated **"Dry Run Mode"** toggle:
* **Dry-Run (`isDryRun = true`)**:
  * Simulates the complete 6-step saga.
  * Inspects all outgoing SOAP envelopes and validates payloads against GAM XSD schemas.
  * Generates simulated Google IDs (`MOCK-ORD-xxx`, `MOCK-LINE-xxx`, `MOCK-CR-xxx`).
  * Generates production-ready GPT tags without mutating live Google inventory.
* **Live Execution (`isDryRun = false`)**:
  * Pushes transactions to live Google Ad Manager network via authenticated OAuth 2.0.
  * Records permanent entity IDs.

---

## 20. Advanced Error Diagnostics & Actionable Remediation

Generic errors like *"API call failed"* are strictly prohibited. The system parses Google SOAP Fault responses into structured diagnostics:

### 20.1 Structured Error Presentation
```text
┌────────────────────────────────────────────────────────────────────────┐
│ ❌ Creative Creation Failed                                            │
├────────────────────────────────────────────────────────────────────────┤
│ Entity: Creative (Assam Tribune - Image - 728x90)                      │
│ Trigger: CreativeService.createCreatives                               │
│ Google Fault: AssetSizeError.ASSET_DOES_NOT_MATCH_CREATIVE_SIZE        │
│ Description: Uploaded image asset was 728x85, expected 728x90.         │
│                                                                        │
│ 💡 Suggested Remediation:                                              │
│ Re-run the canvas contain engine with padding enabled so the canvas   │
│ output strictly matches 728x90.                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 20.2 Admin SOAP Audit Log
* Full XML Request and Response envelopes logged to `gam_api_logs`.
* Sensitive tokens (`Authorization: Bearer ...`, Client Secrets) automatically redacted.
* Searchable by `campaign_id`, `timestamp`, and `service_name`.

---

## 21. Recommended End-to-End User Experience Flow

```text
1. Select Network & Advertiser
   └── Network: Blinkcorp (22068249324) | Advertiser: Assam Tribune (ADV-6074141268)

2. Configure Campaign Flight & Line Item
   ├── Campaign Name: "Festival Mega Sale 2026"
   ├── Line Item Type: [ SPONSORSHIP (Priority 4) ▼ ]  (Auto-selected)
   └── Start & End Flight Dates

3. Configure Creative
   ├── Creative Type: [ Image ▼ ] (Auto-selected)
   ├── Asset Source: Upload Banner Image or Paste URL
   ├── Ad Sizes: ☑ 300x250   ☑ 728x90   ☑ 320x50
   ├── Click URL: https://assamtribune.com/offer (Target: New Window)
   └── Resizing Mode: [ Contain / Fit (No Crop) ▼ ] (Background: #FFFFFF)

4. Real-Time Processing & Interactive Preview
   ├── Proportional Contain Canvas generates exact 300x250, 728x90, 320x50 assets
   └── Multi-size preview tabs show exact appearance with letterbox/pillarbox padding

5. Pre-Flight Validation
   └── Click [ Validate Campaign ] ➔ Displays green checks for all entities

6. Launch
   └── Click [ Launch Campaign ] (or toggle Dry Run)
   └── Live visual stepper displays:
       [Validate] ➔ [Order] ➔ [Line Item] ➔ [3x Creatives] ➔ [3x LICAs] ➔ [READY]

7. Output & Delivery
   ├── Displays created Google Order ID, Line Item ID, Creative IDs
   └── Generates ready-to-use GPT tags and CMS webhook sync options
```

---

## Technical Summary of Corrections Applied

| Section in Original Draft | Identified Inaccuracy / Gap | Applied Technical Correction |
| :--- | :--- | :--- |
| **1. Line Item Type** | Claimed priority 4 can take any impression goal | Corrected: In GAM SOAP API, Sponsorship priority 4 requires `UnitType.PERCENT` or Daily 100% SOV goal. Absolute impression numbers fail GAM validation. |
| **2 & 17. Creative Types** | Treated creative types as simple UI labels | Corrected: Mapped each type to official GAM SOAP `xsi:type` classes (`ImageCreative`, `Html5Creative`, `ThirdPartyCreative`, etc.) with required fields. |
| **4, 5, 6, 7. Resizing & Crop** | Fragmented across 4 redundant sections with missing canvas math | Merged: Created a single mathematically rigorous "Contain" scaling algorithm with centering offsets and strict $(W_t, H_t)$ canvas dimensions. |
| **8 & 18. Multi-Size & Preview** | Disconnected preview and batch creative generation | Merged: Unified batch canvas processing, preview suite, per-size customization, and bulk submission. |
| **LICA Association** | Omitted from original draft | Added: Explicitly defined Google Ad Manager `LineItemCreativeAssociationService` step required to link each created creative to the line item. |
| **16 & 19. Validation & Dry Run** | Overlapping validation checks | Merged: Structured into a 3-tier validation hierarchy (Client Input ➔ Pre-Flight Asset/API ➔ Dry-Run Saga). |
| **20. Error Handling** | Vague API error description | Corrected: Structured Google SOAP Fault parser extracting specific fault codes (`AssetSizeError`, `DatesError`) with actionable remediations. |
