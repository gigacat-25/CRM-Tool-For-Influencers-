"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Users,
  Eye,
  Percent,
  Layers,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  AlertCircle,
  Award
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

// Utility helpers for formatting
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading || !mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const metrics = data?.metrics || {
    totalInfluencers: 0,
    activeInfluencers: 0,
    totalReach: 0,
    avgEngagement: 0,
    activeCampaigns: 0,
    campaignRevenue: 0,
    pendingPayments: 0
  };

  const kpis = [
    {
      title: "Total Influencers",
      value: formatNumber(metrics.totalInfluencers),
      subtitle: `${metrics.activeInfluencers} active now`,
      icon: Users,
      color: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
    },
    {
      title: "Audience Reach",
      value: formatNumber(metrics.totalReach),
      subtitle: "Combined followers",
      icon: Eye,
      color: "bg-blue-500/10 text-blue-500 dark:text-blue-400"
    },
    {
      title: "Avg. Engagement",
      value: `${metrics.avgEngagement}%`,
      subtitle: "Industry average is 3.5%",
      icon: Percent,
      color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
    },
    {
      title: "Active Campaigns",
      value: metrics.activeCampaigns.toString(),
      subtitle: "In-market campaigns",
      icon: Layers,
      color: "bg-amber-500/10 text-amber-500 dark:text-amber-400"
    },
    {
      title: "Campaign Revenue",
      value: formatCurrency(metrics.campaignRevenue),
      subtitle: "Booked values",
      icon: DollarSign,
      color: "bg-violet-500/10 text-violet-500 dark:text-violet-400"
    },
    {
      title: "Pending Payouts",
      value: formatCurrency(metrics.pendingPayments),
      subtitle: "Influencer dues",
      icon: AlertCircle,
      color: "bg-rose-500/10 text-rose-500 dark:text-rose-400"
    }
  ];

  // Colors for distributions
  const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time analytics and statistics across active campaigns, influencers, and payments.
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{kpi.title}</span>
                  <div className={`p-1.5 rounded-lg ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl font-extrabold tracking-tight">{kpi.value}</h3>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">{kpi.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid - Main Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trends (Line) */}
          <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Revenue Growth</h3>
                <p className="text-[11px] text-zinc-500">Monthly cumulative campaign budget values</p>
              </div>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts.revenueTrends}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v/1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(val: any) => [formatCurrency(val), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Influencer Growth (Area) */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Influencer Growth</h3>
                <p className="text-[11px] text-zinc-500">Growth curve of registered creators</p>
              </div>
              <Calendar className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts.influencerGrowth}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distribution Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Categories Distribution (Pie) */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4">Niche Categories</h3>
            <div className="h-56 flex items-center justify-center">
              {data?.categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "11px" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(val) => <span className="text-[10px] font-semibold text-zinc-500">{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-zinc-500">No data available</span>
              )}
            </div>
          </div>

          {/* Locations Distribution (Bar) */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4">City Distribution</h3>
            <div className="h-56">
              {data?.locationDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.locationDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "11px" }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-zinc-500">No data available</span>
              )}
            </div>
          </div>

          {/* Campaign Performance stages (Bar) */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4">Campaign Stages</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section - Timeline & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Timeline */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="font-bold text-sm">Recent Activities</h3>
            </div>
            <div className="flex-1 space-y-4">
              {data?.recentActivities.length > 0 ? (
                data.recentActivities.map((act: any) => {
                  let badgeColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
                  if (act.type === "whatsapp") badgeColor = "bg-emerald-500/10 text-emerald-500";
                  if (act.type === "email") badgeColor = "bg-blue-500/10 text-blue-500";
                  if (act.type === "call") badgeColor = "bg-indigo-500/10 text-indigo-500";
                  if (act.type === "meeting") badgeColor = "bg-violet-500/10 text-violet-500";

                  return (
                    <div key={act.id} className="flex gap-3 text-xs leading-normal">
                      <span className={`px-2 py-0.5 rounded-lg font-semibold h-fit uppercase text-[9px] tracking-wide shrink-0 ${badgeColor}`}>
                        {act.type}
                      </span>
                      <div className="flex-1">
                        <p className="text-zinc-700 dark:text-zinc-300">
                          <span className="font-bold text-foreground">{act.user_name}</span>{" "}
                          {act.content.replace(act.user_name, "").trim()}
                        </p>
                        {act.influencer_name && (
                          <span className="text-[10px] text-zinc-400 block mt-1 font-semibold">
                            Influencer: {act.influencer_name}
                          </span>
                        )}
                        {act.brand_name && (
                          <span className="text-[10px] text-zinc-400 block mt-1 font-semibold">
                            Brand Client: {act.brand_name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                        {new Date(act.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-xs">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Influencers */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
              <Award className="h-4.5 w-4.5 text-violet-500" />
              <h3 className="font-bold text-sm">Top Performing Influencers</h3>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-zinc-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-2">Influencer</th>
                    <th className="pb-2">Reach</th>
                    <th className="pb-2">Engagement</th>
                    <th className="pb-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.topInfluencers.length > 0 ? (
                    data.topInfluencers.map((inf: any) => (
                      <tr key={inf.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-2.5 flex items-center gap-2">
                          <img
                            src={inf.profile_photo}
                            alt={inf.full_name}
                            className="h-6 w-6 rounded-full object-cover border border-border shrink-0"
                          />
                          <div>
                            <span className="font-bold block leading-tight">{inf.full_name}</span>
                            <span className="text-[10px] text-zinc-500 leading-tight">@{inf.username}</span>
                          </div>
                        </td>
                        <td className="py-2.5 font-medium">{formatNumber(inf.followers)}</td>
                        <td className="py-2.5 font-medium text-emerald-500">{inf.engagement_rate}%</td>
                        <td className="py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded-lg font-extrabold text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                            {inf.overall_grade}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500 text-xs">
                        No influencer records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
