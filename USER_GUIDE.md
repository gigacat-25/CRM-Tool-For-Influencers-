# The Scene Co. - Influencer CRM & Campaign Management Platform
## Comprehensive User & Developer Guide

This document provides a detailed overview of the system architecture, database design, configuration with Cloudflare, local development workflows, deployment guidelines, and a step-by-step user guide for all platform modules.

---

## 1. Technical Architecture & Connection

The platform is built as a unified Next.js 16 (React 19) application optimized for edge execution via `@opennextjs/cloudflare`. 

```
[Next.js Client Components]
          │
          ▼ (HTTP Fetches)
[Next.js API Routes]
          │
          ├─────────────────────────────┐
          ▼ (Session JWT / Clerk Auth)  ▼ (db.query / db.execute)
[Auth Verification Layer]        [Unified Database Client]
                                        │
                                        ▼ (Resolves context)
                        ┌───────────────────────────────┐
                        │ env.DB?                       │
                        ├───────────────┬───────────────┤
                        ▼ (Yes)         ▼ (No)
                [Cloudflare D1]   [Local JSON DB Fallback]
```

### Frontend-Backend Connection
- **Zero Hardcoded Data in Components**: All frontend components fetch data from Next.js server-side API endpoints (`/api/*`). The application is 100% dynamic.
- **Unified DB Client ([db.ts](file:///c:/Users/pabt2/Desktop/CRM-Tool-For-Influencers-/src/lib/db.ts))**: Exposes a consistent query interface (`query`, `execute`). Under Cloudflare Pages (or `wrangler pages dev`), it automatically routes queries to the live Cloudflare D1 binding. For standard Node.js local environments (`npm run dev`), it falls back to a local JSON file database at `.tmp/db.json` which is seeded automatically on startup.
- **Hybrid Authentication ([middleware.ts](file:///c:/Users/pabt2/Desktop/CRM-Tool-For-Influencers-/src/middleware.ts))**:
  - **Clerk Mode**: Activates if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is configured in `.env`. Protects routes and provisions/matches users in the database based on their Clerk email on-the-fly.
  - **Local JWT Fallback**: Activates when Clerk keys are missing. For frictionless local testing, it automatically creates a session cookie for a mock **Super Admin** (`Sarah Jenkins`, `superadmin@thescene.co`), granting full access to all pages and API routes without requiring a login screen.

---

## 2. Database Schema

The SQLite schema ([schema.sql](file:///c:/Users/pabt2/Desktop/CRM-Tool-For-Influencers-/schema.sql)) consists of 14 tables tracking the entire agency operations:

1. **`users`**: Role-based access control users (Super Admin, Admin, Manager, Viewer).
2. **`influencers`**: Detailed demographic profiles, pricing, ratings, handles, and audience counts.
3. **`influencer_categories`**: Many-to-many category tagging (e.g. Travel, Fitness).
4. **`influencer_languages`**: Many-to-many language mappings.
5. **`influencer_documents`**: Links to media kits, rate cards, and contracts stored in R2.
6. **`influencer_lists`**: Custom curations (e.g. "Bangalore Food Creators").
7. **`influencer_list_members`**: Many-to-many list association.
8. **`brands`**: Client CRM tracking industries, budgets, contact persons, and spend logs.
9. **`campaigns`**: Brand projects tracking budgets, dates, deliverables, objectives, and stages.
10. **`campaign_influencers`**: Assigned campaign creators tracking views, reach, payment status, and deliverables links.
11. **`payments`**: Ledger tracking incoming brand payments and outgoing creator payouts.
12. **`activities`**: Timeline of whatsapp messages, calls, notes, and emails.
13. **`notes`**: Internal team memos for brands and creators.
14. **`reports`**: History of compiled analytics reports.

---

## 3. Cloudflare & Wrangler Provisioning

The project is fully bound to the following Cloudflare assets:

### D1 Database Configuration
- **Database Name**: `influencer_crm_db`
- **Database ID**: `be5cb151-734b-43a6-aa47-7f728dd8dd7d`
- **Wrangler Binding**: `DB`

### R2 Storage Configuration
- **Bucket Name**: `influencer-crm-storage`
- **Wrangler Binding**: `STORAGE`

### Seed Execution commands:
- **Local SQLite seeding**:
  ```bash
  npx wrangler d1 execute influencer_crm_db --local --file=schema.sql
  npx wrangler d1 execute influencer_crm_db --local --file=.tmp/seed.sql
  ```
- **Remote Cloud D1 seeding**:
  ```bash
  npx wrangler d1 execute influencer_crm_db --remote --file=schema.sql
  npx wrangler d1 execute influencer_crm_db --remote --file=.tmp/seed.sql
  ```

---

## 4. Run & Deploy Workflows

### Option A: Standard Local Development (Frictionless Mock DB)
Best for fast UI/UX editing and frontend styling. Uses `.tmp/db.json`.
1. Run `npm run dev`
2. Open `http://localhost:3000`
3. You will automatically be authenticated as **Super Admin** with complete access to all metrics and views.

### Option B: Local Development with Cloudflare D1 SQLite Binding
Best for verifying SQL query syntax, database triggers, and D1 integration before deploying.
1. Run a production build of the project:
   ```bash
   npm run build
   ```
2. Start the local Wrangler Pages emulator server:
   ```bash
   npx wrangler pages dev .open-next/assets --binding DB=influencer_crm_db --compatibility-flag=nodejs_compat
   ```
3. The server runs at `http://localhost:8788`, executing queries directly against the local Wrangler SQLite file in `.wrangler/state`.

### Option C: Production Cloud Deployment
Deploy to Cloudflare Pages:
1. Run `npm run build`
2. Deploy the build output folder:
   ```bash
   npx wrangler pages deploy .open-next/assets
   ```

---

## 5. Module-by-Module User Guide

### 🔑 Login & Role Permissions
The platform uses Role-Based Access Control (RBAC). When using Clerk, users are assigned roles based on their emails.
- **Super Admin** / **Admin**: Full platform access, including setting up campaigns, managing brand contacts, deleting influencers, editing payouts in the Finance Ledger, and running ROI Reports.
- **Manager**: Can edit influencers, create campaigns, draft contracts, and run Reports. *Cannot access the Finance Ledger.*
- **Viewer**: Read-only access to influencers, brands, and campaigns. *Hides all financial values, budget fields, and ledger panels.*

---

### 📊 Dashboard Analytics
The first screen summarizes ongoing operations:
- **KPI Metrics**: Overall reach, average engagement rate, in-market campaigns, total revenue, and influencer payout dues.
- **Interactive Visualizations**:
  - *Influencer Growth*: Monthly growth line chart.
  - *Campaign Performance*: Stage count breakdown bar chart.
  - *Revenue Trends*: Booked margins progression.
  - *Distribution Pies*: Categories and location distributions.
- **Recent Activities Timeline**: Feed of WhatsApp outreaches, notes, and profile creation events.

---

### 👥 Influencer Directory
The core profiles list allows managing and filtering creators:
- **Filtering Options**: Search by name or handle, filter by Tier (Mega, Macro, Mid, Micro, Nano), primary Category, City, Status, follower range, and engagement rate.
- **AI Natural Language Search**: Enter queries in the search bar such as:
  - *"Show fashion influencers in Mumbai"*
  - *"Find fitness creators with engagement > 5%"*
  - The platform parses the query and filters the directory table in real time.
- **Saved Curation Lists**: Toggle tabs to view specific subsets of creators. Create new lists or delete them.
- **Add / Edit Influencer Modal**: Update social handles, demographic details, locations, primary and secondary languages, and pricing metrics.

---

### 👤 Profile Details & AI Scoring
Clicking any influencer opens their detailed dashboard:
- **Audience Metrics**: Combined followers, engagement rate, average reach (Reels, Stories, Posts), average views, likes, shares, and saves.
- **AI Score Matrix**: Automatically computes scores out of 100 and assigns an overall Grade (`A+`, `A`, `B`, `C`, `D`) based on followers and engagement rate:
  - *Reach Score*: Logarithmic calculation based on audience size.
  - *Engagement Score*: Based on engagement rate.
  - *Campaign Performance*: Average of professional, reliability, and brand fit ratings.
- **Profile Details**: Contact details, bio, language list, pricing grid (Story, Post, Reel, YouTube, UGC rates), strengths, and preferred brands.
- **Media Kits & Rate Cards**: List uploaded documents and view paths.
- **Activity & Note Timeline**: Create internal team notes or view historical email/call records.

---

### 💼 Brand CRM
Manage your brand partners and client relationships:
- **Brands Directory**: Listing company names, industries, budgets, contact persons, active campaigns, and total campaign spend.
- **Add Brand Modal**: Form to input company parameters, contact person email/phone, website, and budget levels.
- **Brand Details Dashboard**: Overview of brand parameters, internal notes, associated campaigns, and activity history.

---

### 📅 Campaign Kanban Board & Workspace
Track campaigns from draft to completion:
- **Kanban Board**: Drag-and-drop campaigns across stages: *Draft*, *Planning*, *Outreach*, *Negotiation*, *Approved*, *Running*, *Completed*, *Cancelled*.
- **Campaign Workspace**:
  - Overview of objectives, dates, deliverables list, and budget.
  - *Assigned Creators List*: Check off specific deliverables for each influencer (e.g. Story, Reel, Post) and track views/reach generated.
  - *Checklist Updates*: Updating influencer deliverable URLs will auto-update reach/views metrics.
  - Add influencers to campaigns via the search assignment modal.

---

### 💬 WhatsApp Outreach Desk
A specialized tool to accelerate creator negotiations:
- **Sidebar Selector**: Select a campaign to view the assigned influencers, their outreach status, and contact handles.
- **Outreach Template Generator**: Select preloaded templates (Initial Pitch, Follow-up, Barter Offer, Campaign Brief, Invoice request).
- **Prefilled Message Prefill**: Select template variables (Campaign Name, Deliverables, Creator Name, Pricing) to generate a custom message.
- **Action Triggers**: Click **Open WhatsApp** to launch WhatsApp Web/Desktop with the text pre-filled and the creator's phone number set.
- **Auto-Log**: Triggering outreach logs a `whatsapp` activity entry in the creator's timeline automatically.

---

### 💵 Finance Ledger
Manage budgets, payouts, and brand invoices:
- **KPI Summary**: Brand Revenue, Creator Payouts, Gross Profit, and Gross Profit Margin.
- **Ledger Table**: Listing payments by type (`influencer_payout` or `brand_payment`), amount, due dates, paid dates, invoice links, and status (`Pending`, `Completed`, `Failed`).
- **Sync Hooks**: Changing a creator's payout transaction status to `Completed` automatically marks the influencer as `Paid` in the Campaign details list.
- **Add Transaction**: Directly record invoice releases or payout clears.
- **CSV Exporter**: Click to export the filtered ledger structure as a CSV report.

---

### 📈 Reports & ROI Panel
Generate ROI sheets for brand clients:
- **ROI Analytics**: Overall Campaign ROI Index, Total Views, average CPV (Cost Per View), and Total Engagements.
- **Visual Charts**: Spend comparison bar chart and Category reach pie chart.
- **Print Overrides**: Pressing `Ctrl + P` (or clicking Print Report) hides navigation elements and formats the metrics beautifully into a clean, multi-page layout optimized for PDF generation or physical printing.

---

### ⌨️ Global Command Palette
Press **`Ctrl + K`** (or `Cmd + K` on macOS) anywhere on the platform to open the Command Palette:
- Navigate to pages (Dashboard, Influencers, Campaigns, WhatsApp Desk, Finance Ledger, Reports).
- Search creators by typing a username (e.g. typing `rohan` displays Rohan Kulkarni with a direct navigation link).
- Create a new Campaign or Brand partner.
- Run an AI Natural Language Search.
- Toggle dark/light theme instantly.
