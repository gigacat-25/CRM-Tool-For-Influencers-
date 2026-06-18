import {
  SEED_USERS,
  SEED_BRANDS,
  SEED_INFLUENCERS,
  SEED_CAMPAIGNS,
  SEED_CAMPAIGN_INFLUENCERS,
  SEED_PAYMENTS,
  SEED_ACTIVITIES,
  SEED_NOTES
} from "../src/lib/seed-data";
import fs from "fs";
import path from "path";

const sqlStatements: string[] = [];

// Helper to escape strings for SQLite
function escape(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "string") {
    return `'${val.replace(/'/g, "''")}'`;
  }
  if (typeof val === "boolean") {
    return val ? "1" : "0";
  }
  return String(val);
}

// 1. Users
SEED_USERS.forEach(u => {
  sqlStatements.push(`INSERT INTO users (id, name, email, password_hash, role) VALUES (${escape(u.id)}, ${escape(u.name)}, ${escape(u.email)}, ${escape(u.password_hash)}, ${escape(u.role)});`);
});

// 2. Brands
SEED_BRANDS.forEach(b => {
  sqlStatements.push(`INSERT INTO brands (id, name, company_name, industry, contact_person, designation, email, phone, website, budget_range, address, notes) VALUES (${escape(b.id)}, ${escape(b.name)}, ${escape(b.company_name)}, ${escape(b.industry)}, ${escape(b.contact_person)}, ${escape(b.designation)}, ${escape(b.email)}, ${escape(b.phone)}, ${escape(b.website)}, ${escape(b.budget_range)}, ${escape(b.address)}, ${escape(b.notes)});`);
});

// 3. Influencers and their relations
SEED_INFLUENCERS.forEach(inf => {
  // Compute tier
  const followers = inf.followers || 0;
  let tier = "Nano";
  if (followers >= 1000000) tier = "Mega";
  else if (followers >= 500000) tier = "Macro";
  else if (followers >= 100000) tier = "Mid";
  else if (followers >= 10000) tier = "Micro";
  
  sqlStatements.push(`INSERT INTO influencers (id, full_name, username, email, phone, dob, gender, bio, website, profile_photo, instagram_handle, instagram_url, youtube_handle, youtube_url, linkedin_handle, linkedin_url, facebook_handle, facebook_url, twitter_handle, twitter_url, snapchat, moj, josh, sharechat, followers, avg_reach, avg_reel_reach, avg_story_reach, avg_post_reach, avg_views, avg_likes, avg_comments, avg_shares, avg_saves, engagement_rate, male_audience_pct, female_audience_pct, age_13_17_pct, age_18_24_pct, age_25_34_pct, age_35_44_pct, age_45_plus_pct, top_cities, top_states, top_countries, country, state, city, area, pincode, primary_lang, secondary_langs, tier, story_price, static_post_price, carousel_price, reel_price, youtube_integration_price, event_appearance_price, ugc_video_price, availability_status, content_quality_rating, communication_rating, professionalism_rating, reliability_rating, brand_fit_rating, notes, strengths, weaknesses, preferred_brands, brands_avoided, reach_score, engagement_score, content_quality_score, communication_score, campaign_performance_score, overall_score, overall_grade) VALUES (${escape(inf.id)}, ${escape(inf.full_name)}, ${escape(inf.username)}, ${escape(inf.email)}, ${escape(inf.phone)}, ${escape(inf.dob)}, ${escape(inf.gender)}, ${escape(inf.bio)}, ${escape(inf.website)}, ${escape(inf.profile_photo)}, ${escape(inf.instagram_handle)}, ${escape(inf.instagram_url)}, ${escape(inf.youtube_handle)}, ${escape(inf.youtube_url)}, ${escape(inf.linkedin_handle)}, ${escape(inf.linkedin_url)}, ${escape(inf.facebook_handle)}, ${escape(inf.facebook_url)}, ${escape(inf.twitter_handle)}, ${escape(inf.twitter_url)}, ${escape(inf.snapchat)}, ${escape(inf.moj)}, ${escape(inf.josh)}, ${escape(inf.sharechat)}, ${escape(inf.followers)}, ${escape(inf.avg_reach)}, ${escape(inf.avg_reel_reach)}, ${escape(inf.avg_story_reach)}, ${escape(inf.avg_post_reach)}, ${escape(inf.avg_views)}, ${escape(inf.avg_likes)}, ${escape(inf.avg_comments)}, ${escape(inf.avg_shares)}, ${escape(inf.avg_saves)}, ${escape(inf.engagement_rate)}, ${escape(inf.male_audience_pct)}, ${escape(inf.female_audience_pct)}, ${escape(inf.age_13_17_pct)}, ${escape(inf.age_18_24_pct)}, ${escape(inf.age_25_34_pct)}, ${escape(inf.age_35_44_pct)}, ${escape(inf.age_45_plus_pct)}, ${escape(inf.top_cities)}, ${escape(inf.top_states)}, ${escape(inf.top_countries)}, ${escape(inf.country)}, ${escape(inf.state)}, ${escape(inf.city)}, ${escape(inf.area)}, ${escape(inf.pincode)}, ${escape(inf.primary_lang)}, ${escape(inf.secondary_langs)}, ${escape(tier)}, ${escape(inf.story_price)}, ${escape(inf.static_post_price)}, ${escape(inf.carousel_price)}, ${escape(inf.reel_price)}, ${escape(inf.youtube_integration_price)}, ${escape(inf.event_appearance_price)}, ${escape(inf.ugc_video_price)}, ${escape(inf.availability_status)}, ${escape(inf.content_quality_rating)}, ${escape(inf.communication_rating)}, ${escape(inf.professionalism_rating)}, ${escape(inf.reliability_rating)}, ${escape(inf.brand_fit_rating)}, ${escape(inf.notes)}, ${escape(inf.strengths)}, ${escape(inf.weaknesses)}, ${escape(inf.preferred_brands)}, ${escape(inf.brands_avoided)}, ${escape(inf.reach_score)}, ${escape(inf.engagement_score)}, ${escape(inf.content_quality_score)}, ${escape(inf.communication_score)}, ${escape(inf.campaign_performance_score)}, ${escape(inf.overall_score)}, ${escape(inf.overall_grade)});`);

  // Categories
  inf.categories.forEach((cat: string) => {
    sqlStatements.push(`INSERT INTO influencer_categories (influencer_id, category) VALUES (${escape(inf.id)}, ${escape(cat)});`);
  });

  // Languages
  inf.languages.forEach((lang: string) => {
    sqlStatements.push(`INSERT INTO influencer_languages (influencer_id, language) VALUES (${escape(inf.id)}, ${escape(lang)});`);
  });
});

// 4. Documents (mock documents from db.ts setup)
sqlStatements.push(`INSERT INTO influencer_documents (id, influencer_id, doc_type, name, file_path) VALUES ('doc_1', 'inf_1', 'media_kit', 'Rohan Travels Media Kit.pdf', '/mock-documents/media_kit_1.pdf');`);
sqlStatements.push(`INSERT INTO influencer_documents (id, influencer_id, doc_type, name, file_path) VALUES ('doc_2', 'inf_3', 'rate_card', 'Kabir Techs Rate Card 2026.pdf', '/mock-documents/rate_card_3.pdf');`);

// 5. Saved Lists
sqlStatements.push(`INSERT INTO influencer_lists (id, name, description, created_by) VALUES ('lst_1', 'Bangalore Food Creators', 'Food bloggers based out of Bengaluru.', 'usr_3');`);
sqlStatements.push(`INSERT INTO influencer_lists (id, name, description, created_by) VALUES ('lst_2', 'Premium Tech Reviewers', 'Top tech reviewers with high engagement.', 'usr_3');`);

sqlStatements.push(`INSERT INTO influencer_list_members (list_id, influencer_id) VALUES ('lst_1', 'inf_6');`);
sqlStatements.push(`INSERT INTO influencer_list_members (list_id, influencer_id) VALUES ('lst_2', 'inf_3');`);

// 6. Campaigns
SEED_CAMPAIGNS.forEach(c => {
  sqlStatements.push(`INSERT INTO campaigns (id, name, brand_id, type, budget, start_date, end_date, deliverables, objectives, stage) VALUES (${escape(c.id)}, ${escape(c.name)}, ${escape(c.brand_id)}, ${escape(c.type)}, ${escape(c.budget)}, ${escape(c.start_date)}, ${escape(c.end_date)}, ${escape(c.deliverables)}, ${escape(c.objectives)}, ${escape(c.stage)});`);
});

// 7. Campaign Influencers
SEED_CAMPAIGN_INFLUENCERS.forEach(ci => {
  sqlStatements.push(`INSERT INTO campaign_influencers (campaign_id, influencer_id, status, reach_generated, views_generated, engagement_generated, payment_amount, invoice_status, deliverables_completed) VALUES (${escape(ci.campaign_id)}, ${escape(ci.influencer_id)}, ${escape(ci.status)}, ${escape(ci.reach_generated)}, ${escape(ci.views_generated)}, ${escape(ci.engagement_generated)}, ${escape(ci.payment_amount)}, ${escape(ci.invoice_status)}, ${escape(ci.deliverables_completed)});`);
});

// 8. Payments
SEED_PAYMENTS.forEach(p => {
  sqlStatements.push(`INSERT INTO payments (id, campaign_id, influencer_id, brand_id, amount, type, status, due_date, paid_date, invoice_url, notes) VALUES (${escape(p.id)}, ${escape(p.campaign_id)}, ${escape(p.influencer_id)}, ${escape(p.brand_id)}, ${escape(p.amount)}, ${escape(p.type)}, ${escape(p.status)}, ${escape(p.due_date)}, ${escape(p.paid_date)}, ${escape(p.invoice_url)}, ${escape(p.notes)});`);
});

// 9. Activities
SEED_ACTIVITIES.forEach(a => {
  sqlStatements.push(`INSERT INTO activities (id, influencer_id, brand_id, campaign_id, type, content, created_by, created_at) VALUES (${escape(a.id)}, ${escape(a.influencer_id)}, ${escape(a.brand_id)}, ${escape(a.campaign_id)}, ${escape(a.type)}, ${escape(a.content)}, ${escape(a.created_by)}, ${escape(a.created_at)});`);
});

// 10. Notes
SEED_NOTES.forEach(n => {
  sqlStatements.push(`INSERT INTO notes (id, influencer_id, brand_id, content, created_by) VALUES (${escape(n.id)}, ${escape(n.influencer_id)}, ${escape(n.brand_id)}, ${escape(n.content)}, ${escape(n.created_by)});`);
});

const outputPath = path.join(__dirname, "seed.sql");
fs.writeFileSync(outputPath, sqlStatements.join("\n"), "utf8");
console.log(`Successfully generated seed SQL script with ${sqlStatements.length} statements at ${outputPath}`);
