"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Percent,
  Download,
  Printer,
  ChevronRight,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  Search,
  DollarSign
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useNotifications } from "@/components/notification-provider";

// Helpers for formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#64748b"];

export default function ReportsPage() {
  const { pushToast } = useNotifications();

  // States
  const [campaignReports, setCampaignReports] = useState<any[]>([]);
  const [brandSpend, setBrandSpend] = useState<any[]>([]);
  const [categoryReports, setCategoryReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const json = await res.json();
        setCampaignReports(json.campaignReports || []);
        setBrandSpend(json.brandSpend || []);
        setCategoryReports(json.categoryReports || []);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
      pushToast({
        type: "error",
        title: "Load Error",
        message: "Failed to compile report summaries."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered campaigns
  const filteredCampaigns = campaignReports.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregated summaries
  const totalViews = campaignReports.reduce((sum, c) => sum + c.totalViews, 0);
  const totalEngagement = campaignReports.reduce((sum, c) => sum + c.totalEngagement, 0);
  const totalSpendCost = campaignReports.reduce((sum, c) => sum + c.payoutCost, 0);
  
  const avgROIIndex = campaignReports.length > 0
    ? parseFloat((campaignReports.reduce((sum, c) => sum + c.roiIndex, 0) / campaignReports.length).toFixed(2))
    : 0.0;

  const overallCPV = totalViews > 0 ? totalSpendCost / totalViews : 0;

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // CSV Exporters
  const handleExportROI = () => {
    if (campaignReports.length === 0) return;
    const headers = ["Campaign Name", "Client Brand", "Allocated Budget (₹)", "Creator Payout Cost (₹)", "Stage", "Total Reach", "Total Views", "Total Engagement", "ROI Index"];
    const rows = campaignReports.map(c => [
      c.name,
      c.brand_name,
      c.budget,
      c.payoutCost,
      c.stage,
      c.totalReach,
      c.totalViews,
      c.totalEngagement,
      c.roiIndex
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "SceneCo_Campaign_ROI_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    pushToast({
      type: "success",
      title: "ROI Report Downloaded",
      message: "Exported campaign ROI analytics successfully."
    });
  };

  return (
    <DashboardLayout>
      {/* Print-only CSS style injection */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, button, input, select, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-full-width {
            width: 100% !important;
            grid-column: span 12 / span 12 !important;
          }
          .card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-500" />
              Reports & ROI Workspace
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Analyze campaign performance, verify brand budget spend distributions, and evaluate creator ROI indexes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print PDF
            </button>
            <button
              onClick={handleExportROI}
              className="flex items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export ROI Data
            </button>
          </div>
        </div>

        {/* Print Only Header Banner */}
        <div className="hidden print:block border-b border-zinc-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">The Scene Co. - Influencer CRM ROI Report</h1>
          <p className="text-xs text-zinc-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Rows */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1 relative overflow-hidden">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average ROI index</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-foreground">{avgROIIndex}x</h3>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> Healthy
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Earned Media Value vs Creator Budget Cost</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Campaign Views</span>
                <h3 className="text-2xl font-extrabold text-indigo-500">{formatNumber(totalViews)}</h3>
                <p className="text-[10px] text-zinc-500">Aggregate views generated across roster</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average CPV</span>
                <h3 className="text-2xl font-extrabold text-emerald-500">₹{overallCPV.toFixed(2)}</h3>
                <p className="text-[10px] text-zinc-500">Average cost per view generated</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Engagements</span>
                <h3 className="text-2xl font-extrabold text-violet-500">{formatNumber(totalEngagement)}</h3>
                <p className="text-[10px] text-zinc-500">Likes + Comments + Shares sum</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print-full-width">
              {/* Brand Spend Chart (7 cols) */}
              <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-sm print-full-width flex flex-col justify-between min-h-[350px]">
                <div className="pb-3 border-b border-border/60">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Brand Budgets Allocated</h3>
                  <p className="text-[10px] text-zinc-500">Total client capital deployed across campaigns</p>
                </div>
                <div className="flex-1 mt-4">
                  {brandSpend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={brandSpend} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <XAxis dataKey="brand_name" tick={{ fill: "#888", fontSize: 10 }} />
                        <YAxis tickFormatter={val => `₹${formatNumber(val)}`} tick={{ fill: "#888", fontSize: 10 }} />
                        <Tooltip formatter={(value: any) => [formatCurrency(value), "Total Budget"]} />
                        <Bar dataKey="total_spend" fill="url(#colorBudget)" radius={[6, 6, 0, 0]}>
                          <defs>
                            <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-20 text-xs text-zinc-500">No brand data available.</div>
                  )}
                </div>
              </div>

              {/* Category Reach Pie Chart (5 cols) */}
              <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-sm print-full-width flex flex-col justify-between min-h-[350px]">
                <div className="pb-3 border-b border-border/60">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Creator Roster Reach by Category</h3>
                  <p className="text-[10px] text-zinc-500">Total follower reach mapped to content category segments</p>
                </div>
                <div className="flex-1 mt-4 flex items-center justify-center">
                  {categoryReports.length > 0 ? (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryReports}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="total_reach"
                              nameKey="category"
                            >
                              {categoryReports.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [formatNumber(value) + " followers", "Reach"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {categoryReports.slice(0, 5).map((entry, idx) => (
                          <div key={entry.category} className="flex items-center gap-2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="truncate flex-1">{entry.category}</span>
                            <span className="text-foreground shrink-0 font-bold">{formatNumber(entry.total_reach)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-xs text-zinc-500">No categories recorded.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign ROI Ledger Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden print-full-width">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
                <div>
                  <h3 className="font-bold text-sm">Campaign Efficacy Breakdown</h3>
                  <p className="text-[10px] text-zinc-500">Detailed ROI multipliers and cost efficiencies per project</p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by name, brand..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none placeholder-zinc-500 text-foreground"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Campaign Name</th>
                      <th className="py-3.5 px-4">Brand Client</th>
                      <th className="py-3.5 px-4 text-right">Budget</th>
                      <th className="py-3.5 px-4 text-right">Creator Spend</th>
                      <th className="py-3.5 px-4 text-right">Views</th>
                      <th className="py-3.5 px-4 text-right">Engagement</th>
                      <th className="py-3.5 px-4 text-right">Avg CPV</th>
                      <th className="py-3.5 px-5 text-right">ROI Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map(c => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-5 font-bold text-zinc-800 dark:text-zinc-200">
                            {c.name}
                          </td>
                          <td className="py-3 px-4">
                            {c.brand_name}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {formatCurrency(c.budget)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {formatCurrency(c.payoutCost)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                            {formatNumber(c.totalViews)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                            {formatNumber(c.totalEngagement)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            ₹{c.costPerView.toFixed(2)}
                          </td>
                          <td className="py-3 px-5 text-right font-extrabold text-indigo-500">
                            {c.roiIndex}x
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-500">No campaigns mapped.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
