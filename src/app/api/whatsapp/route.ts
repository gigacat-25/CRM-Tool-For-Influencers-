import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// GET assigned influencers and outreach statuses
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch lists
    const campaignInfluencers = await db.query("SELECT * FROM campaign_influencers");
    const campaigns = await db.query("SELECT * FROM campaigns");
    const influencers = await db.query("SELECT * FROM influencers");
    const brands = await db.query("SELECT * FROM brands");

    // Assemble joined structures in JS for D1/JSON parity
    const results = campaignInfluencers.map((ci: any) => {
      const camp = campaigns.find((c: any) => c.id === ci.campaign_id);
      const inf = influencers.find((i: any) => i.id === ci.influencer_id);
      const brand = camp ? brands.find((b: any) => b.id === camp.brand_id) : null;

      return {
        campaign_id: ci.campaign_id,
        campaign_name: camp?.name || "Unknown Campaign",
        brand_id: camp?.brand_id || null,
        brand_name: brand?.name || "Unknown Brand",
        influencer_id: ci.influencer_id,
        influencer_name: inf?.full_name || "Unknown Creator",
        influencer_username: inf?.username || "unknown",
        influencer_phone: inf?.phone || "",
        status: ci.status || "Assigned",
        payment_amount: ci.payment_amount || 0,
        deliverables: camp?.deliverables || "",
        invoice_status: ci.invoice_status || "Pending",
        reach_generated: ci.reach_generated || 0,
        views_generated: ci.views_generated || 0,
        engagement_generated: ci.engagement_generated || 0
      };
    });

    return NextResponse.json({ campaign_influencers: results });
  } catch (error) {
    console.error("GET whatsapp api error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update influencer status from whatsapp workspace
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    if (!user || user.role === "viewer") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { campaign_id, influencer_id, status } = await request.json();

    if (!campaign_id || !influencer_id || !status) {
      return NextResponse.json({ error: "Campaign ID, Influencer ID, and Status are required" }, { status: 400 });
    }

    // Check if assignment exists
    const exist = await db.query(
      "SELECT * FROM campaign_influencers WHERE campaign_id = ? AND influencer_id = ?",
      [campaign_id, influencer_id]
    );

    if (exist.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Update status
    await db.execute(
      "UPDATE campaign_influencers SET status = ? WHERE campaign_id = ? AND influencer_id = ?",
      [status, campaign_id, influencer_id]
    );

    // Retrieve campaign info
    const camps = await db.query("SELECT name FROM campaigns WHERE id = ?", [campaign_id]);
    const campaignName = camps[0]?.name || "Campaign";

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, influencer_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, 'whatsapp', ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        influencer_id,
        campaign_id,
        `Outreach status updated to "${status}" for campaign "${campaignName}".`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT whatsapp status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
