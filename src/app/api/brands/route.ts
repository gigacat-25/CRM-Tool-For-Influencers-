import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET all brands with aggregated campaign metrics
export async function GET() {
  try {
    const brands = await db.query("SELECT * FROM brands ORDER BY name ASC");
    const campaigns = await db.query("SELECT id, brand_id, budget, stage FROM campaigns");

    // Aggregate metrics in TS for database engine parity
    const results = brands.map((brand: any) => {
      const brandCamps = campaigns.filter((c: any) => c.brand_id === brand.id);
      
      const campaignCount = brandCamps.length;
      const activeCampaigns = brandCamps.filter((c: any) => c.stage === "Running").length;
      const pastCollaborations = brandCamps.filter((c: any) => c.stage === "Completed").length;
      const totalSpend = brandCamps
        .filter((c: any) => c.stage === "Running" || c.stage === "Completed")
        .reduce((sum: number, c: any) => sum + (c.budget || 0), 0);

      return {
        ...brand,
        campaign_history: campaignCount,
        active_campaigns: activeCampaigns,
        past_collaborations: pastCollaborations,
        total_spend: totalSpend
      };
    });

    return NextResponse.json({ brands: results });
  } catch (error) {
    console.error("GET brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create brand partner
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

    if (!name || !company_name) {
      return NextResponse.json({ error: "Brand name and company name are required" }, { status: 400 });
    }

    const brandId = "brd_" + Math.random().toString(36).substring(2, 9);
    await db.execute(
      `INSERT INTO brands (
        id, name, company_name, industry, contact_person, designation,
        email, phone, website, budget_range, address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brandId, name, company_name, industry || null, contact_person || null, designation || null,
        email || null, phone || null, website || null, budget_range || null, address || null, notes || null
      ]
    );

    // Add activity log
    await db.execute(
      "INSERT INTO activities (id, brand_id, type, content, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        "act_" + Math.random().toString(36).substring(2, 9),
        brandId,
        "note",
        `Created brand partner profile for ${name}.`,
        user.userId
      ]
    );

    return NextResponse.json({ success: true, id: brandId });
  } catch (error) {
    console.error("POST brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
