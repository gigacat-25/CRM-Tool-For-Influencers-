import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// GET detailed brand profile
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const brands = await db.query("SELECT * FROM brands WHERE id = ? LIMIT 1", [id]);
    const brand = brands[0];

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Load related campaigns
    const campaigns = await db.query("SELECT * FROM campaigns WHERE brand_id = ? ORDER BY start_date DESC", [id]);
    
    // Load related activities
    const activities = await db.query(
      "SELECT a.*, u.name as user_name FROM activities a LEFT JOIN users u ON a.created_by = u.id WHERE a.brand_id = ? ORDER BY a.created_at DESC",
      [id]
    );

    // Load related notes
    const notes = await db.query(
      "SELECT n.*, u.name as user_name FROM notes n LEFT JOIN users u ON n.created_by = u.id WHERE n.brand_id = ? ORDER BY n.created_at DESC",
      [id]
    );

    const result = {
      ...brand,
      campaigns,
      activities,
      notes
    };

    return NextResponse.json({ brand: result });
  } catch (error) {
    console.error("GET detailed brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update brand profile
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
      name,
      company_name,
      industry,
      contact_person,
      designation,
      email,
      phone,
      website,
      budget_range,
      address,
      notes
    } = body;

    const exist = await db.query("SELECT id FROM brands WHERE id = ?", [id]);
    if (exist.length === 0) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    await db.execute(
      `UPDATE brands SET
        name = ?, company_name = ?, industry = ?, contact_person = ?, designation = ?,
        email = ?, phone = ?, website = ?, budget_range = ?, address = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name, company_name, industry || null, contact_person || null, designation || null,
        email || null, phone || null, website || null, budget_range || null, address || null, notes || null,
        id
      ]
    );

    // Log activity
    await db.execute(
      "INSERT INTO activities (id, brand_id, type, content, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        id,
        "note",
        "Updated brand partner profile details.",
        user.userId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE brand profile
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

    await db.execute("DELETE FROM brands WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
