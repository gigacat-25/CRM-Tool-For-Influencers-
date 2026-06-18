import { db } from "../src/lib/db";

async function test() {
  console.log("--- BEFORE UPDATE ---");
  const before = await db.query("SELECT * FROM influencers WHERE id = ?", ["inf_xw55dox"]);
  console.log("Before update:", JSON.stringify(before[0], null, 2));

  console.log("--- RUNNING UPDATE ---");
  const result = await db.execute(
    `UPDATE influencers SET
      full_name = ?, email = ?, phone = ?, dob = ?, gender = ?, bio = ?, website = ?, profile_photo = ?,
      instagram_handle = ?, instagram_url = ?, youtube_handle = ?, youtube_url = ?, linkedin_handle = ?, linkedin_url = ?,
      facebook_handle = ?, facebook_url = ?, twitter_handle = ?, twitter_url = ?, snapchat = ?, moj = ?, josh = ?, sharechat = ?,
      followers = ?, avg_reach = ?, avg_reel_reach = ?, avg_story_reach = ?, avg_post_reach = ?, avg_views = ?, avg_likes = ?,
      avg_comments = ?, avg_shares = ?, avg_saves = ?, engagement_rate = ?, male_audience_pct = ?, female_audience_pct = ?,
      age_13_17_pct = ?, age_18_24_pct = ?, age_25_34_pct = ?, age_35_44_pct = ?, age_45_plus_pct = ?, top_cities = ?,
      top_states = ?, top_countries = ?, country = ?, state = ?, city = ?, area = ?, pincode = ?, primary_lang = ?, secondary_langs = ?,
      tier = ?, story_price = ?, static_post_price = ?, carousel_price = ?, reel_price = ?, youtube_integration_price = ?,
      event_appearance_price = ?, ugc_video_price = ?, collab_preferences = ?, availability_status = ?,
      content_quality_rating = ?, communication_rating = ?, professionalism_rating = ?, reliability_rating = ?,
      brand_fit_rating = ?, notes = ?, strengths = ?, weaknesses = ?, preferred_brands = ?, brands_avoided = ?,
      reach_score = ?, engagement_score = ?, content_quality_score = ?, communication_score = ?,
      campaign_performance_score = ?, overall_score = ?, overall_grade = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      "Thejaswin P", "thejaswinps@gmail.com", "9845714699", null, null, "test bio notes", null, null,
      "test.com", "https://instagram.com/test.com", null, null, null, null,
      null, null, null, null, null, null, null, null,
      1000, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1.5,
      50, 50, 10, 40,
      30, 15, 5,
      "[]", "[]", "[]",
      null, null, "bangalore", null, null, null, "[]",
      "Nano", 2500, 0, 0, 5000, 0,
      0, 0, "[]", "Available",
      8, 9, 0, 0,
      0, "New Agency Notes", null, null, null, null,
      46, 15, 50, 50,
      50, 42, "D",
      "inf_xw55dox"
    ]
  );
  console.log("Update result:", result);

  console.log("--- AFTER UPDATE ---");
  const after = await db.query("SELECT * FROM influencers WHERE id = ?", ["inf_xw55dox"]);
  console.log("After update:", JSON.stringify(after[0], null, 2));
}

test().catch(err => console.error("Test error:", err));
