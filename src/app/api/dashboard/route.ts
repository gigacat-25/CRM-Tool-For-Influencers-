import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch base tables
    const influencers = await db.query("SELECT * FROM influencers");
    const categories = await db.query("SELECT * FROM influencer_categories");
    const campaigns = await db.query("SELECT * FROM campaigns");
    const payments = await db.query("SELECT * FROM payments");
    const activities = await db.query("SELECT * FROM activities");
    const users = await db.query("SELECT * FROM users");
    const brands = await db.query("SELECT * FROM brands");

    // 1. Total & Active Influencers
    const totalInfluencers = influencers.length;
    const activeInfluencers = influencers.filter((inf: any) =>
      ["Available", "Booked"].includes(inf.availability_status)
    ).length;

    // 2. Audience Reach and Engagement
    const totalReach = influencers.reduce((sum: number, inf: any) => sum + (inf.followers || 0), 0);
    const avgEngagement = influencers.length > 0
      ? parseFloat((influencers.reduce((sum: number, inf: any) => sum + (inf.engagement_rate || 0), 0) / influencers.length).toFixed(2))
      : 0.0;

    // 3. Campaigns
    const activeCampaigns = campaigns.filter((c: any) => c.stage === "Running").length;
    const campaignRevenue = campaigns
      .filter((c: any) => ["Running", "Completed"].includes(c.stage))
      .reduce((sum: number, c: any) => sum + (c.budget || 0), 0);

    // 4. Pending Payments
    const pendingPayments = payments
      .filter((p: any) => p.status === "Pending" && p.type === "influencer_payout")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // 5. Top Performing Influencers (by overall score desc, limit 5)
    const topInfluencers = [...influencers]
      .sort((a: any, b: any) => (b.overall_score || 0) - (a.overall_score || 0))
      .slice(0, 5)
      .map((inf: any) => ({
        id: inf.id,
        full_name: inf.full_name,
        username: inf.username,
        profile_photo: inf.profile_photo,
        followers: inf.followers,
        engagement_rate: inf.engagement_rate,
        overall_grade: inf.overall_grade,
        overall_score: inf.overall_score
      }));

    // 6. Top Categories (group by category, count, order desc, limit 5)
    const categoryCounts: { [key: string]: number } = {};
    categories.forEach((cat: any) => {
      const name = cat.category;
      categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    });
    const categoryRes = Object.keys(categoryCounts)
      .map(name => ({ name, value: categoryCounts[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 7. Top Cities (group by city, count, order desc, limit 5)
    const cityCounts: { [key: string]: number } = {};
    influencers.forEach((inf: any) => {
      if (inf.city) {
        cityCounts[inf.city] = (cityCounts[inf.city] || 0) + 1;
      }
    });
    const cityRes = Object.keys(cityCounts)
      .map(name => ({ name, value: cityCounts[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 8. Recent Activities (LEFT JOIN users u, influencers i, brands b, order desc, limit 5)
    const recentActivities = [...activities]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((act: any) => {
        const user = users.find((u: any) => u.id === act.created_by);
        const influencer = influencers.find((i: any) => i.id === act.influencer_id);
        const brand = brands.find((b: any) => b.id === act.brand_id);
        return {
          id: act.id,
          type: act.type,
          content: act.content,
          created_at: act.created_at,
          user_name: user ? user.name : "System",
          influencer_name: influencer ? influencer.full_name : null,
          brand_name: brand ? brand.name : null
        };
      });

    // 9. Mocking Trend Data for Charts
    const influencerGrowthData = [
      { month: "Jan", count: Math.max(1, Math.round(totalInfluencers * 0.4)) },
      { month: "Feb", count: Math.max(2, Math.round(totalInfluencers * 0.5)) },
      { month: "Mar", count: Math.max(3, Math.round(totalInfluencers * 0.7)) },
      { month: "Apr", count: Math.max(4, Math.round(totalInfluencers * 0.8)) },
      { month: "May", count: Math.max(5, Math.round(totalInfluencers * 0.9)) },
      { month: "Jun", count: totalInfluencers }
    ];

    const campaignPerformanceData = [
      { name: "Draft", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "draft").length },
      { name: "Planning", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "planning").length },
      { name: "Outreach", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "outreach").length },
      { name: "Negotiation", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "negotiation").length },
      { name: "Approved", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "approved").length },
      { name: "Running", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "running").length },
      { name: "Completed", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "completed").length },
      { name: "Cancelled", count: campaigns.filter((c: any) => c.stage?.toLowerCase() === "cancelled").length }
    ];

    const revenueTrendsData = [
      { month: "Jan", revenue: Math.round(campaignRevenue * 0.2) },
      { month: "Feb", revenue: Math.round(campaignRevenue * 0.3) },
      { month: "Mar", revenue: Math.round(campaignRevenue * 0.55) },
      { month: "Apr", revenue: Math.round(campaignRevenue * 0.6) },
      { month: "May", revenue: Math.round(campaignRevenue * 0.8) },
      { month: "Jun", revenue: campaignRevenue }
    ];

    return NextResponse.json({
      metrics: {
        totalInfluencers,
        activeInfluencers,
        totalReach,
        avgEngagement,
        activeCampaigns,
        campaignRevenue,
        pendingPayments
      },
      topInfluencers,
      categoryDistribution: categoryRes,
      locationDistribution: cityRes,
      recentActivities,
      charts: {
        influencerGrowth: influencerGrowthData,
        campaignPerformance: campaignPerformanceData,
        revenueTrends: revenueTrendsData
      }
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
