import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// GET all payments with campaign/influencer/brand details
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    
    // Only super_admin and admin can access financial endpoints
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await db.query("SELECT * FROM payments ORDER BY due_date DESC");
    const campaigns = await db.query("SELECT id, name, brand_id FROM campaigns");
    const influencers = await db.query("SELECT id, full_name, username FROM influencers");
    const brands = await db.query("SELECT id, name FROM brands");

    // Assemble joined data
    const results = payments.map((pay: any) => {
      const camp = campaigns.find((c: any) => c.id === pay.campaign_id);
      const inf = influencers.find((i: any) => i.id === pay.influencer_id);
      
      // For brand payments, brand_id is in pay.brand_id.
      // For influencer payouts, brand can be retrieved via the campaign.
      const resolvedBrandId = pay.brand_id || camp?.brand_id;
      const brand = brands.find((b: any) => b.id === resolvedBrandId);

      return {
        ...pay,
        campaign_name: camp?.name || "Direct / No Campaign",
        influencer_name: inf?.full_name || null,
        influencer_username: inf?.username || null,
        brand_name: brand?.name || "Direct / No Brand"
      };
    });

    return NextResponse.json({ payments: results });
  } catch (error) {
    console.error("GET finance payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new payment ledger entry
export async function POST(request: Request) {
  try {
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
    const { campaign_id, influencer_id, brand_id, amount, type, status, due_date, notes, invoice_url } = body;

    if (!amount || !type || !status) {
      return NextResponse.json({ error: "Amount, Type, and Status are required" }, { status: 400 });
    }

    const paymentId = "pay_" + Math.random().toString(36).substring(2, 9);
    
    await db.execute(
      `INSERT INTO payments (
        id, campaign_id, influencer_id, brand_id, amount, type, status, due_date, notes, invoice_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        campaign_id || null,
        influencer_id || null,
        brand_id || null,
        Number(amount),
        type,
        status,
        due_date || new Date().toISOString().split("T")[0],
        notes || null,
        invoice_url || null
      ]
    );

    // If it's an influencer payout and status is completed, sync the campaign_influencers
    if (type === "influencer_payout" && status === "Completed" && campaign_id && influencer_id) {
      await db.execute(
        `UPDATE campaign_influencers SET invoice_status = 'Paid', status = 'Paid'
         WHERE campaign_id = ? AND influencer_id = ?`,
        [campaign_id, influencer_id]
      );
    }

    // Log activity
    let activityText = `Created ${type === "influencer_payout" ? "payout record" : "invoice record"} of ${amount} (Status: ${status}).`;
    await db.execute(
      "INSERT INTO activities (id, influencer_id, brand_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, ?, 'note', ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        influencer_id || null,
        brand_id || null,
        campaign_id || null,
        activityText,
        user.userId
      ]
    );

    return NextResponse.json({ success: true, paymentId });
  } catch (error) {
    console.error("POST finance payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
