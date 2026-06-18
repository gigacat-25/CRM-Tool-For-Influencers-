import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET campaigns
export async function GET() {
  try {
    const campaigns = await db.query(
      "SELECT c.*, b.name as client_name FROM campaigns c LEFT JOIN brands b ON c.brand_id = b.id ORDER BY c.created_at DESC"
    );

    // Fetch assignment counts for each campaign
    const assignments = await db.query("SELECT campaign_id, COUNT(*) as count FROM campaign_influencers GROUP BY campaign_id");

    const results = campaigns.map((camp: any) => {
      const assign = assignments.find((a: any) => a.campaign_id === camp.id);
      return {
        ...camp,
        influencers_count: assign?.count || 0
      };
    });

    return NextResponse.json({ campaigns: results });
  } catch (error) {
    console.error("GET campaigns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create campaign
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, brand_id, type, budget, start_date, end_date, deliverables, objectives } = body;

    if (!name || !brand_id) {
      return NextResponse.json({ error: "Campaign name and client brand are required" }, { status: 400 });
    }

    const campaignId = "cmp_" + Math.random().toString(36).substring(2, 9);
    await db.execute(
      `INSERT INTO campaigns (
        id, name, brand_id, type, budget, start_date, end_date, deliverables, objectives, stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`,
      [
        campaignId, name, brand_id, type || null, Number(budget || 0.0),
        start_date || null, end_date || null, deliverables || null, objectives || null
      ]
    );

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, brand_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        brand_id,
        campaignId,
        "note",
        `Created campaign "${name}" for brand.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true, id: campaignId });
  } catch (error) {
    console.error("POST campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
