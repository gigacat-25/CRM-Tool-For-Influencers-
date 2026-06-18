import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJWT, hashPassword } from "@/lib/auth";
import { calculateInfluencerScores } from "@/lib/seed-data";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET influencers with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const search = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const city = searchParams.get("city") || "";
    const tier = searchParams.get("tier") || "";
    const status = searchParams.get("status") || "";
    const listId = searchParams.get("listId") || "";
    
    const minFollowers = parseInt(searchParams.get("minFollowers") || "0", 10);
    const maxFollowers = parseInt(searchParams.get("maxFollowers") || "999999999", 10);
    
    const minER = parseFloat(searchParams.get("minER") || "0.0");
    const maxReelRate = parseInt(searchParams.get("maxReelRate") || "999999999", 10);

    // Fetch base records
    const influencers = await db.query("SELECT * FROM influencers");
    const categories = await db.query("SELECT * FROM influencer_categories");
    const languages = await db.query("SELECT * FROM influencer_languages");
    const listMembers = await db.query("SELECT * FROM influencer_list_members");

    // Assemble metadata
    let results = influencers.map((inf: any) => {
      const infCats = categories
        .filter((c: any) => c.influencer_id === inf.id)
        .map((c: any) => c.category);
      const infLangs = languages
        .filter((l: any) => l.influencer_id === inf.id)
        .map((l: any) => l.language);
      const infLists = listMembers
        .filter((m: any) => m.influencer_id === inf.id)
        .map((m: any) => m.list_id);

      return {
        ...inf,
        categories: infCats,
        languages: infLangs,
        lists: infLists
      };
    });

    // Apply filtering in JavaScript for engine parity
    if (search) {
      const query = search.toLowerCase();
      results = results.filter(
        (inf: any) =>
          inf.full_name.toLowerCase().includes(query) ||
          inf.username.toLowerCase().includes(query) ||
          (inf.bio && inf.bio.toLowerCase().includes(query)) ||
          (inf.city && inf.city.toLowerCase().includes(query)) ||
          (inf.state && inf.state.toLowerCase().includes(query))
      );
    }

    if (category) {
      results = results.filter((inf: any) => inf.categories.includes(category));
    }

    if (city) {
      results = results.filter((inf: any) => inf.city?.toLowerCase() === city.toLowerCase());
    }

    if (tier) {
      results = results.filter((inf: any) => inf.tier?.toLowerCase() === tier.toLowerCase());
    }

    if (status) {
      results = results.filter((inf: any) => inf.availability_status?.toLowerCase() === status.toLowerCase());
    }

    if (listId) {
      results = results.filter((inf: any) => inf.lists.includes(listId));
    }

    // Metric filters
    results = results.filter(
      (inf: any) =>
        inf.followers >= minFollowers &&
        inf.followers <= maxFollowers &&
        inf.engagement_rate >= minER &&
        (inf.reel_price || 0) <= maxReelRate
    );

    return NextResponse.json({ influencers: results });
  } catch (error) {
    console.error("GET influencers route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create influencer
export async function POST(request: Request) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    if (!user || user.role === "viewer") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      full_name,
      username,
      email,
      phone,
      dob,
      gender,
      bio,
      website,
      profile_photo,
      instagram_handle,
      instagram_url,
      youtube_handle,
      youtube_url,
      linkedin_handle,
      linkedin_url,
      facebook_handle,
      facebook_url,
      twitter_handle,
      twitter_url,
      snapchat,
      moj,
      josh,
      sharechat,
      followers,
      avg_reach,
      avg_reel_reach,
      avg_story_reach,
      avg_post_reach,
      avg_views,
      avg_likes,
      avg_comments,
      avg_shares,
      avg_saves,
      engagement_rate,
      male_audience_pct,
      female_audience_pct,
      age_13_17_pct,
      age_18_24_pct,
      age_25_34_pct,
      age_35_44_pct,
      age_45_plus_pct,
      top_cities,
      top_states,
      top_countries,
      country,
      state,
      city,
      area,
      pincode,
      primary_lang,
      secondary_langs,
      story_price,
      static_post_price,
      carousel_price,
      reel_price,
      youtube_integration_price,
      event_appearance_price,
      ugc_video_price,
      collab_preferences,
      availability_status,
      content_quality_rating,
      communication_rating,
      professionalism_rating,
      reliability_rating,
      brand_fit_rating,
      notes,
      strengths,
      weaknesses,
      preferred_brands,
      brands_avoided,
      categories, // array of strings
      languages // array of strings
    } = body;

    if (!full_name || !username) {
      return NextResponse.json({ error: "Full name and username are required" }, { status: 400 });
    }

    // Auto-calculate Tier
    let autoTier = "Nano";
    const fCount = Number(followers || 0);
    if (fCount >= 1000000) autoTier = "Mega";
    else if (fCount >= 500000) autoTier = "Macro";
    else if (fCount >= 100000) autoTier = "Mid";
    else if (fCount >= 10000) autoTier = "Micro";
    else autoTier = "Nano";

    // Prepare scores calculation object
    const rawScoresInput = {
      followers: fCount,
      engagement_rate: Number(engagement_rate || 0.0),
      content_quality_rating: Number(content_quality_rating || 0),
      communication_rating: Number(communication_rating || 0),
      professionalism_rating: Number(professionalism_rating || 0),
      reliability_rating: Number(reliability_rating || 0),
      brand_fit_rating: Number(brand_fit_rating || 0)
    };

    // Calculate AI Scores & Grade
    const scoreCalc = calculateInfluencerScores(rawScoresInput);

    const influencerId = "inf_" + Math.random().toString(36).substring(2, 9);
    
    // Insert influencer record
    await db.execute(
      `INSERT INTO influencers (
        id, full_name, username, email, phone, dob, gender, bio, website, profile_photo,
        instagram_handle, instagram_url, youtube_handle, youtube_url, linkedin_handle, linkedin_url,
        facebook_handle, facebook_url, twitter_handle, twitter_url, snapchat, moj, josh, sharechat,
        followers, avg_reach, avg_reel_reach, avg_story_reach, avg_post_reach, avg_views, avg_likes,
        avg_comments, avg_shares, avg_saves, engagement_rate, male_audience_pct, female_audience_pct,
        age_13_17_pct, age_18_24_pct, age_25_34_pct, age_35_44_pct, age_45_plus_pct, top_cities,
        top_states, top_countries, country, state, city, area, pincode, primary_lang, secondary_langs,
        tier, story_price, static_post_price, carousel_price, reel_price, youtube_integration_price,
        event_appearance_price, ugc_video_price, collab_preferences, availability_status,
        content_quality_rating, communication_rating, professionalism_rating, reliability_rating,
        brand_fit_rating, notes, strengths, weaknesses, preferred_brands, brands_avoided,
        reach_score, engagement_score, content_quality_score, communication_score,
        campaign_performance_score, overall_score, overall_grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        influencerId, full_name, username, email || null, phone || null, dob || null, gender || null, bio || null, website || null,
        profile_photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
        instagram_handle || null, instagram_url || null, youtube_handle || null, youtube_url || null, linkedin_handle || null, linkedin_url || null,
        facebook_handle || null, facebook_url || null, twitter_handle || null, twitter_url || null, snapchat || null, moj || null, josh || null, sharechat || null,
        fCount, Number(avg_reach || 0), Number(avg_reel_reach || 0), Number(avg_story_reach || 0), Number(avg_post_reach || 0), Number(avg_views || 0),
        Number(avg_likes || 0), Number(avg_comments || 0), Number(avg_shares || 0), Number(avg_saves || 0), Number(engagement_rate || 0.0),
        Number(male_audience_pct || 50.0), Number(female_audience_pct || 50.0), Number(age_13_17_pct || 10.0), Number(age_18_24_pct || 40.0),
        Number(age_25_34_pct || 30.0), Number(age_35_44_pct || 15.0), Number(age_45_plus_pct || 5.0),
        top_cities || JSON.stringify([]), top_states || JSON.stringify([]), top_countries || JSON.stringify([]),
        country || null, state || null, city || null, area || null, pincode || null, primary_lang || null,
        secondary_langs || JSON.stringify([]), autoTier, Number(story_price || 0), Number(static_post_price || 0),
        Number(carousel_price || 0), Number(reel_price || 0), Number(youtube_integration_price || 0),
        Number(event_appearance_price || 0), Number(ugc_video_price || 0),
        collab_preferences || JSON.stringify([]), availability_status || "Available",
        Number(content_quality_rating || 0), Number(communication_rating || 0), Number(professionalism_rating || 0),
        Number(reliability_rating || 0), Number(brand_fit_rating || 0), notes || null, strengths || null, weaknesses || null,
        preferred_brands || null, brands_avoided || null,
        scoreCalc.reach_score, scoreCalc.engagement_score, scoreCalc.content_quality_score, scoreCalc.communication_score,
        scoreCalc.campaign_performance_score, scoreCalc.overall_score, scoreCalc.overall_grade
      ]
    );

    // Insert categories relation
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await db.execute("INSERT INTO influencer_categories (influencer_id, category) VALUES (?, ?)", [
          influencerId,
          cat
        ]);
      }
    }

    // Insert languages relation
    if (languages && Array.isArray(languages)) {
      for (const lang of languages) {
        await db.execute("INSERT INTO influencer_languages (influencer_id, language) VALUES (?, ?)", [
          influencerId,
          lang
        ]);
      }
    }

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, influencer_id, type, content, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        influencerId,
        "note",
        `Created influencer profile for ${full_name}.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true, id: influencerId });
  } catch (error: any) {
    console.error("POST influencer route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
