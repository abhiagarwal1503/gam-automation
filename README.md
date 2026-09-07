# Google Ad Manager (DFP) Ad Placement Automation System

An end-to-end automated ad-booking system for **Google Ad Manager (formerly DoubleClick for Publishers / DFP)**.

Given only minimal advertiser input (**Advertiser Name**, **Banner URL**, **Start Date**, **End Date**, **Target/Click URL**, and **Ad Size**), the system automatically validates assets, manages inventory ad units, generates Google Publisher Tag (GPT) snippets, creates Orders, creates Line Items with targeting and flight dates, creates Image Creatives, associates creatives with line items (LICA), and saves all Google Entity IDs with complete idempotency and failure recovery.

---

## Architecture Overview

```text
               ┌──────────────────────────────┐
               │    React + TypeScript UI     │
               │ (Tailwind CSS, Stepper, GPT) │
               └──────────────┬───────────────┘
                              │ REST API
               ┌──────────────▼───────────────┐
               │   Node.js + Express Server   │
               │  (Saga Engine & Idempotency) │
               └───────┬──────────────┬───────┘
                       │              │
        ┌──────────────▼──────┐ ┌─────▼────────────────────────┐
        │ PostgreSQL / SQLite │ │ Google Ad Manager SOAP Layer │
        │   Database Engine   │ │ (v202511 SOAP Services)      │
        └─────────────────────┘ └─────┬────────────────────────┘
                                      │ OAuth 2.0 / HTTPS
                                ┌─────▼────────────────────────┐
                                │ Google Ad Manager Network    │
                                └──────────────────────────────┘
```

---

## Google Ad Manager Workflow & Saga Execution

The system executes a strictly tracked, step-by-step state machine:

```text
Client Campaign Input
        ↓
1. Validate Campaign (URL security, image dimensions & HTTP accessibility)
        ↓
2. Search / Create Advertiser (GAM CompanyService)
        ↓
3. Search / Create Ad Unit (GAM InventoryService)
        ↓
4. Generate GPT Tag (Official Google Publisher Tag JavaScript & DIV)
        ↓
5. Create Order (GAM OrderService)
        ↓
6. Create Line Item (GAM LineItemService - Targeting Ad Unit, Dates, CPM)
        ↓
7. Create Creative (GAM CreativeService - ImageCreative)
        ↓
8. Associate Creative (GAM LineItemCreativeAssociationService - LICA)
        ↓
9. Store all Google IDs & Mark READY
```

### Idempotency & Failure Diagnostics
- **Idempotent**: Re-running or retrying a campaign reuses already created Google IDs and entities, preventing duplicate orders or inventory.
- **Diagnostics**: If an operation fails, the system pinpoints the exact step, extracts the Google SOAP fault string, and recommends actionable remediation.
- **Dry-Run Mode**: Included by default to allow local end-to-end simulation, tag generation, and payload inspection without mutating production inventory.

---

## Features

- **Automated Ad Placement**: End-to-end GAM booking with 1 click.
- **Asset Inspector & Validator**: Real-time validation of banner image URLs, headers, and dimensions matching selected ad slot sizes.
- **Live Visual Stepper**: Animated state machine with color-coded step status (`VALIDATING` → `CREATING_ADVERTISER` → `CREATING_AD_UNIT` → `CREATING_ORDER` → `CREATING_LINE_ITEM` → `CREATING_CREATIVE` → `ASSOCIATING_CREATIVE` → `READY`).
- **Google Publisher Tag (GPT) Engine**: Generates official GPT Head Code (`googletag.defineSlot`), Body Code (`<div id="...">`), and standalone HTML previews with 1-click copy and download.
- **Ad Unit Inventory Manager**: Full table of Ad Units with naming conventions (`{website}_{position}_{size}`).
- **API & Audit Logs**: Detailed JSON payload inspector recording all outgoing SOAP XML envelopes and incoming GAM responses.
- **Configurable Settings**: Line item types (STANDARD, SPONSORSHIP, PRICE_PRIORITY), priority, cost types (CPM, CPC), timezones, and API version (`v202511`).

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run build
npm test
npm run dev
```

The backend server runs at `http://localhost:5001`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build
npm run dev
```

The React dashboard opens at `http://localhost:5173`.

---

## Google Ad Manager API Setup & Authentication

1. In the **Google Cloud Console**, create an OAuth 2.0 Client ID (Web Application).
2. Set the Authorized Redirect URI to: `http://localhost:5001/api/auth/google/callback`.
3. In **Google Ad Manager**, navigate to **Admin > Global Settings > Network settings** and enable **API access**.
4. Grant the authenticated user or service account role permissions to create Orders, Line Items, Creatives, and Companies.
5. In the Settings page of the app, configure your **Network Code** (e.g. `12345678`), **API Version** (`v202511`), and connect via OAuth.

---

## Docker Deployment

To launch the entire stack using Docker:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:80`
- Backend: `http://localhost:5001`

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create a campaign & trigger automated workflow |
| `GET` | `/api/campaigns/:id` | Get campaign detail with all linked GAM IDs & logs |
| `POST` | `/api/campaigns/:id/run` | Execute workflow for draft campaign |
| `POST` | `/api/campaigns/:id/retry` | Retry failed campaign step |
| `POST` | `/api/campaigns/:id/pause` | Pause campaign |
| `POST` | `/api/campaigns/:id/resume` | Resume campaign |
| `GET` | `/api/ad-units` | List Ad Units inventory |
| `POST` | `/api/ad-units` | Create a new Ad Unit |
| `GET` | `/api/advertisers` | List Advertisers |
| `POST` | `/api/gpt/generate` | Generate GPT Head & Body tags |
| `GET` | `/api/logs` | View SOAP API execution & audit logs |
| `GET` | `/api/settings` | Get system settings & network configuration |
| `PUT` | `/api/settings` | Update placement defaults & network settings |
