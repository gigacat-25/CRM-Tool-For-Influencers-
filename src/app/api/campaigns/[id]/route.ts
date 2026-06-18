import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// GET detailed campaign workspace
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaigns = await db.query(
      "SELECT c.*, b.name as client_name, b.company_name as client_company FROM campaigns c LEFT JOIN brands b ON c.brand_id = b.id WHERE c.id = ? LIMIT 1",
      [id]
    );
    const campaign = campaigns[0];

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Load assigned influencers and their metrics
    const influencers = await db.query(
      `SELECT ci.*, i.full_name, i.username, i.profile_photo, i.followers, i.engagement_rate
       FROM campaign_influencers ci
       JOIN influencers i ON ci.influencer_id = i.id
       WHERE ci.campaign_id = ?`,
      [id]
    );

    // Load related payments
    const payments = await db.query("SELECT * FROM payments WHERE campaign_id = ?", [id]);

    const result = {
      ...campaign,
      influencers,
      payments
    };

    return NextResponse.json({ campaign: result });
  } catch (error) {
    console.error("GET detailed campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update campaign details
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
    const { name, type, budget, start_date, end_date, deliverables, objectives, stage } = body;

    const exist = await db.query("SELECT id, brand_id, name FROM campaigns WHERE id = ?", [id]);
    const campaign = exist[0];
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await db.execute(
      `UPDATE campaigns SET
        name = ?, type = ?, budget = ?, start_date = ?, end_date = ?,
        deliverables = ?, objectives = ?, stage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name, type || null, Number(budget || 0.0), start_date || null, end_date || null,
        deliverables || null, objectives || null, stage || "Draft",
        id
      ]
    );

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, brand_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        campaign.brand_id,
        id,
        "note",
        `Updated campaign stage to "${stage}".`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE campaign
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Deletions require Super Admin permissions" }, { status: 403 });
    }

    await db.execute("DELETE FROM campaigns WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
