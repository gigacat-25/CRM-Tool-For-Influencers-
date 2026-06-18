-- Schema for Scene Co. Influencer CRM

-- 1. Users table (for Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin', 'manager', 'viewer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for user email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  dob TEXT,
  gender TEXT,
  bio TEXT,
  website TEXT,
  profile_photo TEXT,
  
  -- Social media handles & URLs
  instagram_handle TEXT,
  instagram_url TEXT,
  youtube_handle TEXT,
  youtube_url TEXT,
  linkedin_handle TEXT,
  linkedin_url TEXT,
  facebook_handle TEXT,
  facebook_url TEXT,
  twitter_handle TEXT,
  twitter_url TEXT,
  snapchat TEXT,
  moj TEXT,
  josh TEXT,
  sharechat TEXT,

  -- Audience metrics
  followers INTEGER DEFAULT 0,
  avg_reach INTEGER DEFAULT 0,
  avg_reel_reach INTEGER DEFAULT 0,
  avg_story_reach INTEGER DEFAULT 0,
  avg_post_reach INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0.0,

  -- Audience demographics
  male_audience_pct REAL DEFAULT 0.0,
  female_audience_pct REAL DEFAULT 0.0,
  age_13_17_pct REAL DEFAULT 0.0,
  age_18_24_pct REAL DEFAULT 0.0,
  age_25_34_pct REAL DEFAULT 0.0,
  age_35_44_pct REAL DEFAULT 0.0,
  age_45_plus_pct REAL DEFAULT 0.0,
  top_cities TEXT, -- JSON string or comma-separated
  top_states TEXT,
  top_countries TEXT,

  -- Location
  country TEXT,
  state TEXT,
  city TEXT,
  area TEXT,
  pincode TEXT,

  -- Languages
  primary_lang TEXT,
  secondary_langs TEXT,

  -- Tier (auto-calculated nano, micro, etc.)
  tier TEXT,

  -- Pricing
  story_price REAL DEFAULT 0.0,
  static_post_price REAL DEFAULT 0.0,
  carousel_price REAL DEFAULT 0.0,
  reel_price REAL DEFAULT 0.0,
  youtube_integration_price REAL DEFAULT 0.0,
  event_appearance_price REAL DEFAULT 0.0,
  ugc_video_price REAL DEFAULT 0.0,

  -- Availability
  availability_status TEXT DEFAULT 'Available' CHECK(availability_status IN ('Available', 'Busy', 'Booked', 'Inactive', 'Blacklisted')),

  -- Internal Agency Ratings (1-10)
  content_quality_rating INTEGER DEFAULT 0,
  communication_rating INTEGER DEFAULT 0,
  professionalism_rating INTEGER DEFAULT 0,
  reliability_rating INTEGER DEFAULT 0,
  brand_fit_rating INTEGER DEFAULT 0,

  -- Agency Notes
  notes TEXT,
  strengths TEXT,
  weaknesses TEXT,
  preferred_brands TEXT,
  brands_avoided TEXT,

  -- AI Scores (1-100) & Grade (A+, A, B, C, D)
  reach_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  content_quality_score INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  campaign_performance_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  overall_grade TEXT CHECK(overall_grade IN ('A+', 'A', 'B', 'C', 'D')),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_username ON influencers(username);
CREATE INDEX IF NOT EXISTS idx_influencers_city ON influencers(city);
CREATE INDEX IF NOT EXISTS idx_influencers_tier ON influencers(tier);
CREATE INDEX IF NOT EXISTS idx_influencers_overall_grade ON influencers(overall_grade);

-- 3. Influencer Categories (Many-to-Many via relation table)
CREATE TABLE IF NOT EXISTS influencer_categories (
  influencer_id TEXT NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (influencer_id, category),
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

-- 4. Influencer Languages (Many-to-Many via relation table)
CREATE TABLE IF NOT EXISTS influencer_languages (
  influencer_id TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (influencer_id, language),
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

-- 5. Influencer Documents (Media Kits, Contracts, Invoices, etc.)
CREATE TABLE IF NOT EXISTS influencer_documents (
  id TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('profile_photo', 'media_kit', 'rate_card', 'contract', 'invoice', 'report')),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- R2 URL or local path
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

-- 6. Saved Influencer Lists (e.g., "Bangalore Food Creators")
CREATE TABLE IF NOT EXISTS influencer_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Influencer List Members (Many-to-Many)
CREATE TABLE IF NOT EXISTS influencer_list_members (
  list_id TEXT NOT NULL,
  influencer_id TEXT NOT NULL,
  PRIMARY KEY (list_id, influencer_id),
  FOREIGN KEY (list_id) REFERENCES influencer_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

-- 8. Brands CRM Table
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT,
  contact_person TEXT,
  designation TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  budget_range TEXT,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- 9. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  type TEXT, -- e.g., "Instagram", "YouTube", "Barter"
  budget REAL DEFAULT 0.0,
  start_date TEXT,
  end_date TEXT,
  deliverables TEXT,
  objectives TEXT,
  stage TEXT DEFAULT 'Draft' CHECK(stage IN ('Draft', 'Planning', 'Outreach', 'Negotiation', 'Approved', 'Running', 'Completed', 'Cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_stage ON campaigns(stage);

-- 10. Campaign Influencers Relation Table
CREATE TABLE IF NOT EXISTS campaign_influencers (
  campaign_id TEXT NOT NULL,
  influencer_id TEXT NOT NULL,
  status TEXT DEFAULT 'Assigned' CHECK(status IN ('Assigned', 'Contacted', 'Negotiating', 'Approved', 'Running', 'Deliverables Completed', 'Paid', 'Declined')),
  reach_generated INTEGER DEFAULT 0,
  views_generated INTEGER DEFAULT 0,
  engagement_generated INTEGER DEFAULT 0,
  payment_amount REAL DEFAULT 0.0,
  invoice_status TEXT DEFAULT 'Pending' CHECK(invoice_status IN ('Pending', 'Invoiced', 'Paid')),
  deliverables_completed TEXT, -- Comma-separated or JSON array of URLs
  PRIMARY KEY (campaign_id, influencer_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
);

-- 11. Payments and Finance Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  influencer_id TEXT,
  brand_id TEXT,
  amount REAL DEFAULT 0.0,
  type TEXT NOT NULL CHECK(type IN ('influencer_payout', 'brand_payment')),
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Completed', 'Failed')),
  due_date TEXT,
  paid_date TEXT,
  invoice_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE SET NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 12. Activities and Communications Timeline
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  influencer_id TEXT,
  brand_id TEXT,
  campaign_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('call', 'email', 'whatsapp', 'meeting', 'follow_up', 'note')),
  content TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. General Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  influencer_id TEXT,
  brand_id TEXT,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Exported Reports Log
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('influencer', 'campaign', 'finance', 'roi')),
  parameters TEXT, -- JSON query criteria
  file_url TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
