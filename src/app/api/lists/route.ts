import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET lists
export async function GET() {
  try {
    const lists = await db.query(
      "SELECT l.*, u.name as creator_name, (SELECT COUNT(*) FROM influencer_list_members WHERE list_id = l.id) as count FROM influencer_lists l LEFT JOIN users u ON l.created_by = u.id ORDER BY l.created_at DESC"
    );
    return NextResponse.json({ lists });
  } catch (error) {
    console.error("GET lists error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create list
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    const listId = "lst_" + Math.random().toString(36).substring(2, 9);
    await db.execute(
      "INSERT INTO influencer_lists (id, name, description, created_by) VALUES (?, ?, ?, ?)",
      [listId, name, description || null, user.userId]
    );

    return NextResponse.json({ success: true, listId });
  } catch (error) {
    console.error("POST list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
