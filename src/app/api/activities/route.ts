import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

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

    const { influencer_id, brand_id, campaign_id, type, content } = await request.json();

    if (!type || !content) {
      return NextResponse.json({ error: "Type and content are required" }, { status: 400 });
    }

    const activityId = "act_" + Math.random().toString(36).substring(2, 9);
    await db.execute(
      "INSERT INTO activities (id, influencer_id, brand_id, campaign_id, type, content, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        activityId,
        influencer_id || null,
        brand_id || null,
        campaign_id || null,
        type,
        content,
        user.userId
      ]
    );

    return NextResponse.json({ success: true, activityId });
  } catch (error) {
    console.error("POST activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
