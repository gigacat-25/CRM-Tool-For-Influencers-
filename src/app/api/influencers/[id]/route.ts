import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJWT } from "@/lib/auth";
import { calculateInfluencerScores } from "@/lib/seed-data";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET detailed influencer profile
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Await params in Next.js 15

    const influencers = await db.query("SELECT * FROM influencers WHERE id = ? LIMIT 1", [id]);
    const influencer = influencers[0];

    if (!influencer) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    // Load related metadata
    const categories = await db.query("SELECT category FROM influencer_categories WHERE influencer_id = ?", [id]);
    const languages = await db.query("SELECT language FROM influencer_languages WHERE influencer_id = ?", [id]);
    const documents = await db.query("SELECT * FROM influencer_documents WHERE influencer_id = ?", [id]);
    const activities = await db.query(
      "SELECT a.*, u.name as user_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.influencer_id = ? ORDER BY a.created_at DESC",
      [id]
    );

    const notes = await db.query(
      "SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.created_by = u.id WHERE n.influencer_id = ? ORDER BY n.created_at DESC",
      [id]
    );

    const result = {
      ...influencer,
      categories: categories.map((c: any) => c.category),
      languages: languages.map((l: any) => l.language),
      documents,
      activities,
      notes
    };

    return NextResponse.json({ influencer: result });
  } catch (error) {
    console.error("GET detailed influencer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update influencer profile
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

    // Fetch existing record to preserve fields not sent by the edit form
    const existing = await db.query("SELECT * FROM influencers WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }
    const existingInf = existing[0];

    // Recalculate tier
    let autoTier = "Nano";
    const fCount = Number(followers ?? existingInf.followers ?? 0);
    if (fCount >= 1000000) autoTier = "Mega";
    else if (fCount >= 500000) autoTier = "Macro";
    else if (fCount >= 100000) autoTier = "Mid";
    else if (fCount >= 10000) autoTier = "Micro";
    else autoTier = "Nano";

    // Recalculate scores
    const rawScoresInput = {
      followers: fCount,
      engagement_rate: Number(engagement_rate ?? existingInf.engagement_rate ?? 0.0),
      content_quality_rating: Number(content_quality_rating ?? existingInf.content_quality_rating ?? 0),
      communication_rating: Number(communication_rating ?? existingInf.communication_rating ?? 0),
      professionalism_rating: Number(professionalism_rating ?? existingInf.professionalism_rating ?? 0),
      reliability_rating: Number(reliability_rating ?? existingInf.reliability_rating ?? 0),
      brand_fit_rating: Number(brand_fit_rating ?? existingInf.brand_fit_rating ?? 0)
    };

    const scoreCalc = calculateInfluencerScores(rawScoresInput);

    // Update statement
    await db.execute(
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
        full_name || existingInf.full_name,
        email !== undefined ? (email || null) : existingInf.email,
        phone !== undefined ? (phone || null) : existingInf.phone,
        dob !== undefined ? (dob || null) : existingInf.dob,
        gender !== undefined ? (gender || null) : existingInf.gender,
        bio !== undefined ? (bio || null) : existingInf.bio,
        website !== undefined ? (website || null) : existingInf.website,
        // Preserve existing profile_photo if not explicitly provided
        profile_photo !== undefined ? (profile_photo || existingInf.profile_photo) : existingInf.profile_photo,
        instagram_handle !== undefined ? (instagram_handle || null) : existingInf.instagram_handle,
        instagram_url !== undefined ? (instagram_url || null) : existingInf.instagram_url,
        youtube_handle !== undefined ? (youtube_handle || null) : existingInf.youtube_handle,
        youtube_url !== undefined ? (youtube_url || null) : existingInf.youtube_url,
        linkedin_handle !== undefined ? (linkedin_handle || null) : existingInf.linkedin_handle,
        linkedin_url !== undefined ? (linkedin_url || null) : existingInf.linkedin_url,
        facebook_handle !== undefined ? (facebook_handle || null) : existingInf.facebook_handle,
        facebook_url !== undefined ? (facebook_url || null) : existingInf.facebook_url,
        twitter_handle !== undefined ? (twitter_handle || null) : existingInf.twitter_handle,
        twitter_url !== undefined ? (twitter_url || null) : existingInf.twitter_url,
        snapchat !== undefined ? (snapchat || null) : existingInf.snapchat,
        moj !== undefined ? (moj || null) : existingInf.moj,
        josh !== undefined ? (josh || null) : existingInf.josh,
        sharechat !== undefined ? (sharechat || null) : existingInf.sharechat,
        fCount,
        Number(avg_reach ?? existingInf.avg_reach ?? 0),
        Number(avg_reel_reach ?? existingInf.avg_reel_reach ?? 0),
        Number(avg_story_reach ?? existingInf.avg_story_reach ?? 0),
        Number(avg_post_reach ?? existingInf.avg_post_reach ?? 0),
        Number(avg_views ?? existingInf.avg_views ?? 0),
        Number(avg_likes ?? existingInf.avg_likes ?? 0),
        Number(avg_comments ?? existingInf.avg_comments ?? 0),
        Number(avg_shares ?? existingInf.avg_shares ?? 0),
        Number(avg_saves ?? existingInf.avg_saves ?? 0),
        Number(engagement_rate ?? existingInf.engagement_rate ?? 0.0),
        Number(male_audience_pct ?? existingInf.male_audience_pct ?? 50.0),
        Number(female_audience_pct ?? existingInf.female_audience_pct ?? 50.0),
        Number(age_13_17_pct ?? existingInf.age_13_17_pct ?? 10.0),
        Number(age_18_24_pct ?? existingInf.age_18_24_pct ?? 40.0),
        Number(age_25_34_pct ?? existingInf.age_25_34_pct ?? 30.0),
        Number(age_35_44_pct ?? existingInf.age_35_44_pct ?? 15.0),
        Number(age_45_plus_pct ?? existingInf.age_45_plus_pct ?? 5.0),
        top_cities !== undefined ? (top_cities || JSON.stringify([])) : existingInf.top_cities,
        top_states !== undefined ? (top_states || JSON.stringify([])) : existingInf.top_states,
        top_countries !== undefined ? (top_countries || JSON.stringify([])) : existingInf.top_countries,
        country !== undefined ? (country || null) : existingInf.country,
        state !== undefined ? (state || null) : existingInf.state,
        city !== undefined ? (city || null) : existingInf.city,
        area !== undefined ? (area || null) : existingInf.area,
        pincode !== undefined ? (pincode || null) : existingInf.pincode,
        primary_lang !== undefined ? (primary_lang || null) : existingInf.primary_lang,
        secondary_langs !== undefined ? (secondary_langs || JSON.stringify([])) : existingInf.secondary_langs,
        autoTier,
        Number(story_price ?? existingInf.story_price ?? 0),
        Number(static_post_price ?? existingInf.static_post_price ?? 0),
        Number(carousel_price ?? existingInf.carousel_price ?? 0),
        Number(reel_price ?? existingInf.reel_price ?? 0),
        Number(youtube_integration_price ?? existingInf.youtube_integration_price ?? 0),
        Number(event_appearance_price ?? existingInf.event_appearance_price ?? 0),
        Number(ugc_video_price ?? existingInf.ugc_video_price ?? 0),
        collab_preferences !== undefined ? (collab_preferences || JSON.stringify([])) : existingInf.collab_preferences,
        availability_status || existingInf.availability_status || "Available",
        Number(content_quality_rating ?? existingInf.content_quality_rating ?? 0),
        Number(communication_rating ?? existingInf.communication_rating ?? 0),
        Number(professionalism_rating ?? existingInf.professionalism_rating ?? 0),
        Number(reliability_rating ?? existingInf.reliability_rating ?? 0),
        Number(brand_fit_rating ?? existingInf.brand_fit_rating ?? 0),
        notes !== undefined ? (notes || null) : existingInf.notes,
        strengths !== undefined ? (strengths || null) : existingInf.strengths,
        weaknesses !== undefined ? (weaknesses || null) : existingInf.weaknesses,
        preferred_brands !== undefined ? (preferred_brands || null) : existingInf.preferred_brands,
        brands_avoided !== undefined ? (brands_avoided || null) : existingInf.brands_avoided,
        scoreCalc.reach_score, scoreCalc.engagement_score, scoreCalc.content_quality_score, scoreCalc.communication_score,
        scoreCalc.campaign_performance_score, scoreCalc.overall_score, scoreCalc.overall_grade,
        id
      ]
    );

    // Sync categories (DELETE and re-INSERT)
    await db.execute("DELETE FROM influencer_categories WHERE influencer_id = ?", [id]);
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await db.execute("INSERT INTO influencer_categories (influencer_id, category) VALUES (?, ?)", [id, cat]);
      }
    }

    // Sync languages
    await db.execute("DELETE FROM influencer_languages WHERE influencer_id = ?", [id]);
    if (languages && Array.isArray(languages)) {
      for (const lang of languages) {
        await db.execute("INSERT INTO influencer_languages (influencer_id, language) VALUES (?, ?)", [id, lang]);
      }
    }

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, influencer_id, type, content, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        id,
        "note",
        `Updated influencer profile details.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT influencer error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE influencer
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    
    // Deletions are strictly limited to Super Admin
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Deletions require Super Admin role" }, { status: 403 });
    }

    // Perform deletion (Cascade constraints handle categories, languages, etc.)
    await db.execute("DELETE FROM influencers WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE influencer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
