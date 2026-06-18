import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

// DELETE a shortlist
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    await db.execute("DELETE FROM influencer_lists WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT add/remove member in a list
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

    const { influencer_id, action } = await request.json();

    if (!influencer_id || !action) {
      return NextResponse.json({ error: "Influencer ID and action ('add' or 'remove') are required" }, { status: 400 });
    }

    if (action === "add") {
      // Check duplicate
      const exist = await db.query(
        "SELECT * FROM influencer_list_members WHERE list_id = ? AND influencer_id = ?",
        [id, influencer_id]
      );
      if (exist.length === 0) {
        await db.execute(
          "INSERT INTO influencer_list_members (list_id, influencer_id) VALUES (?, ?)",
          [id, influencer_id]
        );
      }
    } else if (action === "remove") {
      await db.execute(
        "DELETE FROM influencer_list_members WHERE list_id = ? AND influencer_id = ?",
        [id, influencer_id]
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT list member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
