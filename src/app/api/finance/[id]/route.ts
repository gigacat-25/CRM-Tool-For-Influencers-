import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// PUT update payment status or details
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, invoice_url, paid_date } = body;

    // Check existence
    const payments = await db.query("SELECT * FROM payments WHERE id = ?", [id]);
    const payment = payments[0];
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const nextStatus = status || payment.status;
    let nextPaidDate = paid_date || payment.paid_date;

    if (nextStatus === "Completed" && payment.status !== "Completed") {
      nextPaidDate = new Date().toISOString().split("T")[0];
    } else if (nextStatus !== "Completed") {
      nextPaidDate = null;
    }

    // Update statement
    await db.execute(
      `UPDATE payments SET
        status = ?, notes = ?, invoice_url = ?, paid_date = ?
      WHERE id = ?`,
      [
        nextStatus,
        notes !== undefined ? notes : payment.notes,
        invoice_url !== undefined ? invoice_url : payment.invoice_url,
        nextPaidDate,
        id
      ]
    );

    // Sync status back to campaign_influencers if it's an influencer payout
    if (payment.type === "influencer_payout" && payment.campaign_id && payment.influencer_id) {
      if (nextStatus === "Completed") {
        await db.execute(
          `UPDATE campaign_influencers SET invoice_status = 'Paid', status = 'Paid'
           WHERE campaign_id = ? AND influencer_id = ?`,
          [payment.campaign_id, payment.influencer_id]
        );
      } else if (nextStatus === "Failed" || nextStatus === "Pending") {
        await db.execute(
          `UPDATE campaign_influencers SET invoice_status = 'Pending'
           WHERE campaign_id = ? AND influencer_id = ?`,
          [payment.campaign_id, payment.influencer_id]
        );
      }
    }

    // Log activity
    await db.execute(
      "INSERT INTO activities (id, influencer_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, 'note', ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        payment.influencer_id || null,
        payment.campaign_id || null,
        `Payment record status updated to "${nextStatus}". Payout amount: ${payment.amount}.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT finance payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE payment record (Super Admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    
    // Strict deletion control: Super Admin only
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Deletions require Super Admin permissions" }, { status: 403 });
    }

    // Check existence
    const payments = await db.query("SELECT * FROM payments WHERE id = ?", [id]);
    if (payments.length === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    await db.execute("DELETE FROM payments WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE finance payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
