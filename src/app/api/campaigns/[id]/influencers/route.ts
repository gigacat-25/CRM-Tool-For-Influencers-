import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// POST assign influencer to campaign
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { influencer_id, payment_amount } = await request.json();

    if (!influencer_id) {
      return NextResponse.json({ error: "Influencer ID is required" }, { status: 400 });
    }

    // Check duplicate
    const exist = await db.query(
      "SELECT * FROM campaign_influencers WHERE campaign_id = ? AND influencer_id = ?",
      [id, influencer_id]
    );
    if (exist.length > 0) {
      return NextResponse.json({ error: "Influencer is already assigned to this campaign" }, { status: 400 });
    }

    const amount = Number(payment_amount || 0.0);

    // Insert assignment
    await db.execute(
      `INSERT INTO campaign_influencers (
        campaign_id, influencer_id, status, reach_generated, views_generated,
        engagement_generated, payment_amount, invoice_status, deliverables_completed
      ) VALUES (?, ?, 'Assigned', 0, 0, 0, ?, 'Pending', '')`,
      [id, influencer_id, amount]
    );

    // Retrieve campaign info for due date
    const camps = await db.query("SELECT end_date, name FROM campaigns WHERE id = ?", [id]);
    const campaign = camps[0];
    const dueDate = campaign?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Auto-create pending payment voucher
    const paymentId = "pay_" + Math.random().toString(36).substring(2, 9);
    await db.execute(
      `INSERT INTO payments (
        id, campaign_id, influencer_id, brand_id, amount, type, status, due_date, notes
      ) VALUES (?, ?, ?, NULL, ?, 'influencer_payout', 'Pending', ?, ?)`,
      [
        paymentId,
        id,
        influencer_id,
        amount,
        dueDate,
        `Payout for campaign: ${campaign?.name || "Unassigned"}`
      ]
    );

    // Log activity
    await db.execute(
      "INSERT INTO activities (id, influencer_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, 'whatsapp', ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        influencer_id,
        id,
        `Assigned to campaign "${campaign?.name || "New Campaign"}" with payout budget ${amount}.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST campaign influencer assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update assignment metrics and status
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
    const {
      influencer_id,
      status,
      reach_generated,
      views_generated,
      engagement_generated,
      invoice_status,
      deliverables_completed
    } = body;

    if (!influencer_id) {
      return NextResponse.json({ error: "Influencer ID is required" }, { status: 400 });
    }

    // Check assignment
    const exist = await db.query(
      "SELECT * FROM campaign_influencers WHERE campaign_id = ? AND influencer_id = ?",
      [id, influencer_id]
    );
    if (exist.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Update assignment metrics
    await db.execute(
      `UPDATE campaign_influencers SET
        status = ?, reach_generated = ?, views_generated = ?, engagement_generated = ?,
        invoice_status = ?, deliverables_completed = ?
      WHERE campaign_id = ? AND influencer_id = ?`,
      [
        status || exist[0].status,
        Number(reach_generated !== undefined ? reach_generated : exist[0].reach_generated),
        Number(views_generated !== undefined ? views_generated : exist[0].views_generated),
        Number(engagement_generated !== undefined ? engagement_generated : exist[0].engagement_generated),
        invoice_status || exist[0].invoice_status,
        deliverables_completed !== undefined ? deliverables_completed : exist[0].deliverables_completed,
        id,
        influencer_id
      ]
    );

    // If invoice_status changes to paid, sync the corresponding payment record
    if (invoice_status === "Paid") {
      await db.execute(
        `UPDATE payments SET status = 'Completed', paid_date = CURRENT_TIMESTAMP
         WHERE campaign_id = ? AND influencer_id = ? AND type = 'influencer_payout'`,
        [id, influencer_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT campaign influencer assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
