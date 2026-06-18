import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await verifySessionJWT(token);
    
    // Super Admin, Admin, and Manager can view reports
    if (!user || user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch lists
    const campaigns = await db.query("SELECT * FROM campaigns");
    const brands = await db.query("SELECT * FROM brands");
    const influencers = await db.query("SELECT * FROM influencers");
    const campaignInfluencers = await db.query("SELECT * FROM campaign_influencers");
    const influencerCategories = await db.query("SELECT * FROM influencer_categories");

    // 1. Campaign Metrics & ROI
    const campaignReports = campaigns.map((camp: any) => {
      const brand = brands.find((b: any) => b.id === camp.brand_id);
      const assignments = campaignInfluencers.filter((ci: any) => ci.campaign_id === camp.id);
      
      const totalReach = assignments.reduce((sum, a) => sum + (a.reach_generated || 0), 0);
      const totalViews = assignments.reduce((sum, a) => sum + (a.views_generated || 0), 0);
      const totalEngagement = assignments.reduce((sum, a) => sum + (a.engagement_generated || 0), 0);
      const payoutCost = assignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0);

      // Cost per engagement (CPE) & Cost per View (CPV)
      const costPerEngagement = totalEngagement > 0 ? payoutCost / totalEngagement : 0;
      const costPerView = totalViews > 0 ? payoutCost / totalViews : 0;

      // ROI multiplier (Estimated Media Value / cost)
      // Standard EMV: Views * ₹0.50 + Engagement * ₹2.00
      const estMediaValue = (totalViews * 0.50) + (totalEngagement * 2.00);
      const roiIndex = payoutCost > 0 ? parseFloat((estMediaValue / payoutCost).toFixed(2)) : 0.0;

      return {
        id: camp.id,
        name: camp.name,
        brand_name: brand?.name || "Unknown Brand",
        budget: camp.budget || 0,
        payoutCost,
        stage: camp.stage,
        totalReach,
        totalViews,
        totalEngagement,
        costPerEngagement,
        costPerView,
        roiIndex
      };
    });

    // 2. Brand Spend Summary
    const brandSpend = brands.map((b: any) => {
      const brandCamps = campaigns.filter((c: any) => c.brand_id === b.id);
      const totalBudget = brandCamps.reduce((sum, c) => sum + (c.budget || 0), 0);
      return {
        brand_name: b.name,
        total_campaigns: brandCamps.length,
        total_spend: totalBudget
      };
    }).filter(b => b.total_campaigns > 0);

    // 3. Category Distribution Performance
    // Find unique categories
    const categories = Array.from(new Set(influencerCategories.map((ic: any) => ic.category)));
    const categoryReports = categories.map((cat: string) => {
      const creatorIds = influencerCategories.filter((ic: any) => ic.category === cat).map((ic: any) => ic.influencer_id);
      const catCreators = influencers.filter((i: any) => creatorIds.includes(i.id));

      const totalCreators = catCreators.length;
      const avgER = totalCreators > 0 ? parseFloat((catCreators.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / totalCreators).toFixed(2)) : 0.0;
      const totalFollowers = catCreators.reduce((sum, c) => sum + (c.followers || 0), 0);

      return {
        category: cat,
        total_creators: totalCreators,
        avg_engagement_rate: avgER,
        total_reach: totalFollowers
      };
    }).filter(c => c.total_creators > 0).sort((a, b) => b.total_creators - a.total_creators);

    return NextResponse.json({
      campaignReports,
      brandSpend,
      categoryReports
    });
  } catch (error) {
    console.error("GET reports route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
