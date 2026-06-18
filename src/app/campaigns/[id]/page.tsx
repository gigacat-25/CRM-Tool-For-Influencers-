"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import {
  ArrowLeft,
  Calendar,
  Layers,
  DollarSign,
  Users,
  Eye,
  CheckCircle,
  FileText,
  Activity,
  Plus,
  Loader2,
  Sparkles,
  MapPin,
  TrendingUp,
  Award,
  Link,
  ChevronRight,
  PlusCircle,
  Save,
  Trash2,
  CheckSquare,
  AlertCircle,
  Edit2,
  X,
  UserCheck
} from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params); // Unwrap params promise with React 19 use()
  const router = useRouter();
  const { pushToast } = useNotifications();

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [allInfluencers, setAllInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("0");
  const [assigning, setAssigning] = useState(false);

  // Edit metric row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReach, setEditReach] = useState("0");
  const [editViews, setEditViews] = useState("0");
  const [editEngagement, setEditEngagement] = useState("0");
  const [editStatus, setEditStatus] = useState("");
  const [editInvoice, setEditInvoice] = useState("");
  const [editLink, setEditLink] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);

  const loadCampaignData = async () => {
    try {
      // Load current user
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }

      // Load detailed campaign
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      } else {
        pushToast({
          type: "error",
          title: "Not Found",
          message: "Campaign does not exist."
        });
        router.push("/campaigns");
      }

      // Load all influencers for assignment list
      const infRes = await fetch("/api/influencers");
      if (infRes.ok) {
        const infJson = await infRes.json();
        setAllInfluencers(infJson.influencers);
      }
    } catch (err) {
      console.error("Failed to load campaign workspace details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const handleAssignInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfluencerId) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_id: selectedInfluencerId,
          payment_amount: parseFloat(payoutAmount) || 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        pushToast({
          type: "success",
          title: "Creator Assigned",
          message: "Influencer added to campaign and payment voucher created."
        });
        setShowAssignModal(false);
        setSelectedInfluencerId("");
        setPayoutAmount("0");
        loadCampaignData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Assignment Failed",
        message: err.message || "Something went wrong."
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveMetrics = async (influencerId: string) => {
    setSavingMetrics(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/influencers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_id: influencerId,
          status: editStatus,
          reach_generated: parseInt(editReach, 10) || 0,
          views_generated: parseInt(editViews, 10) || 0,
          engagement_generated: parseInt(editEngagement, 10) || 0,
          invoice_status: editInvoice,
          deliverables_completed: editLink
        })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Metrics Logged",
          message: "Updated creator campaign metrics successfully."
        });
        setEditingId(null);
        loadCampaignData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to update metrics."
      });
    } finally {
      setSavingMetrics(false);
    }
  };

  const startEditing = (member: any) => {
    setEditingId(member.influencer_id);
    setEditStatus(member.status);
    setEditReach(String(member.reach_generated || 0));
    setEditViews(String(member.views_generated || 0));
    setEditEngagement(String(member.engagement_generated || 0));
    setEditInvoice(member.invoice_status);
    setEditLink(member.deliverables_completed || "");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) return null;

  // Aggregate Metrics
  const totalReach = campaign.influencers.reduce((sum: number, i: any) => sum + (i.reach_generated || 0), 0);
  const totalViews = campaign.influencers.reduce((sum: number, i: any) => sum + (i.views_generated || 0), 0);
  const totalEngagement = campaign.influencers.reduce((sum: number, i: any) => sum + (i.engagement_generated || 0), 0);
  
  // ROI Index = (Reach * 0.1 + Views * 0.2 + Engagement * 0.5) / Budget
  const roiMultiplier = campaign.budget > 0
    ? (((totalReach * 0.1) + (totalViews * 0.2) + (totalEngagement * 0.5)) / campaign.budget).toFixed(2)
    : "0.00";

  // Filter out already assigned influencers
  const assignedIds = campaign.influencers.map((i: any) => i.influencer_id);
  const unassignedInfluencers = allInfluencers.filter(inf => !assignedIds.includes(inf.id));

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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Back */}
        <button
          onClick={() => router.push("/campaigns")}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </button>

        {/* Campaign Header Details */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Client: {campaign.client_name} ({campaign.client_company})
            </span>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.name}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{campaign.type}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide inline-block ${
              campaign.stage === "Running"
                ? "bg-indigo-500/10 text-indigo-500"
                : campaign.stage === "Completed"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-zinc-500/10 text-zinc-500"
            }`}>
              Stage: {campaign.stage}
            </span>
            <div className="text-right">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Campaign Budget</span>
              <span className="text-xl font-extrabold text-foreground">{formatCurrency(campaign.budget)}</span>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Grid Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Creators Assigned</span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
              {campaign.influencers.length}
            </span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Reach</span>
            <span className="text-lg font-extrabold text-foreground mt-1 block">
              {formatNumber(totalReach)}
            </span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Views</span>
            <span className="text-lg font-extrabold text-foreground mt-1 block">
              {formatNumber(totalViews)}
            </span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Engagement</span>
            <span className="text-lg font-extrabold text-emerald-500 mt-1 block">
              {formatNumber(totalEngagement)}
            </span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center col-span-2 lg:col-span-1">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
              Campaign ROI Index
            </span>
            <span className="text-lg font-extrabold text-indigo-500 mt-1 block">
              {roiMultiplier}x
            </span>
          </div>
        </div>

        {/* Campaign Description & Deliverables info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border p-5 rounded-2xl shadow-sm text-xs font-semibold">
          <div>
            <span className="text-[9px] text-zinc-400 uppercase block tracking-wider mb-1">Campaign Deliverables Requirements</span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{campaign.deliverables || "No deliverables detailed."}</p>
          </div>
          <div>
            <span className="text-[9px] text-zinc-400 uppercase block tracking-wider mb-1">Campaign Core Objectives</span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{campaign.objectives || "No objectives detailed."}</p>
          </div>
        </div>

        {/* Assigned Creators Section */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              Assigned Creator Workspaces
            </h3>
            {currentUser?.role !== "viewer" && (
              <button
                onClick={() => {
                  if (unassignedInfluencers.length > 0) {
                    setSelectedInfluencerId(unassignedInfluencers[0].id);
                  }
                  setShowAssignModal(true);
                }}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Assign Creator
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10 text-zinc-400 font-bold uppercase tracking-wider text-[9px] p-3">
                  <th className="p-3">Influencer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Views Generated</th>
                  <th className="p-3">Reach Generated</th>
                  <th className="p-3">Engagement</th>
                  <th className="p-3">Payout Due</th>
                  <th className="p-3">Invoice Status</th>
                  <th className="p-3">Deliverables link</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaign.influencers.length > 0 ? (
                  campaign.influencers.map((member: any) => {
                    const isEditing = editingId === member.influencer_id;
                    return (
                      <tr key={member.influencer_id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={member.profile_photo}
                            alt={member.full_name}
                            className="h-8 w-8 rounded-full object-cover border border-border"
                          />
                          <div>
                            <span className="font-bold block leading-tight">{member.full_name}</span>
                            <span className="text-[9px] text-zinc-400 block leading-tight">@{member.username}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value)}
                              className="bg-background border border-border text-[10px] font-bold rounded p-1"
                            >
                              <option value="Assigned">Assigned</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Negotiating">Negotiating</option>
                              <option value="Approved">Approved</option>
                              <option value="Running">Running</option>
                              <option value="Deliverables Completed">Completed</option>
                              <option value="Paid">Paid</option>
                            </select>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              member.status === "Deliverables Completed" || member.status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : member.status === "Running"
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-zinc-500/10 text-zinc-500"
                            }`}>
                              {member.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editViews}
                              onChange={e => setEditViews(e.target.value)}
                              className="w-16 bg-background border border-border rounded p-1 text-[10px]"
                            />
                          ) : (
                            formatNumber(member.views_generated)
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editReach}
                              onChange={e => setEditReach(e.target.value)}
                              className="w-16 bg-background border border-border rounded p-1 text-[10px]"
                            />
                          ) : (
                            formatNumber(member.reach_generated)
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editEngagement}
                              onChange={e => setEditEngagement(e.target.value)}
                              className="w-16 bg-background border border-border rounded p-1 text-[10px]"
                            />
                          ) : (
                            formatNumber(member.engagement_generated)
                          )}
                        </td>
                        <td className="p-3 font-bold">{formatCurrency(member.payment_amount)}</td>
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editInvoice}
                              onChange={e => setEditInvoice(e.target.value)}
                              className="bg-background border border-border text-[10px] font-bold rounded p-1"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Invoiced">Invoiced</option>
                              <option value="Paid">Paid</option>
                            </select>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              member.invoice_status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : member.invoice_status === "Invoiced"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}>
                              {member.invoice_status}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editLink}
                              onChange={e => setEditLink(e.target.value)}
                              placeholder="Captions or Draft link..."
                              className="w-32 bg-background border border-border rounded p-1 text-[10px]"
                            />
                          ) : member.deliverables_completed ? (
                            <a
                              href={member.deliverables_completed}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:underline flex items-center gap-1 font-bold"
                            >
                              <Link className="h-3 w-3 shrink-0" />
                              View Link
                            </a>
                          ) : (
                            <span className="text-zinc-400">Not sent</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {currentUser?.role !== "viewer" && (
                            <div className="flex justify-end gap-1.5">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveMetrics(member.influencer_id)}
                                  disabled={savingMetrics}
                                  className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors cursor-pointer"
                                >
                                  {savingMetrics ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditing(member)}
                                  className="p-1.5 border border-border hover:bg-secondary text-zinc-500 rounded transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-zinc-500 text-xs font-semibold">
                      No influencers assigned to this campaign yet. Click "Assign Creator" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Associated Payment vouchers ledger */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5 text-indigo-500" />
            Financial Vouchers Ledger
          </h3>
          <div className="space-y-2">
            {campaign.payments.length > 0 ? (
              campaign.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 border border-border rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/10">
                  <div>
                    <span className="font-bold block">Voucher ID: {p.id}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Due Date: {p.due_date} | Type: {p.type === "influencer_payout" ? "Influencer Payout" : "Brand Invoice"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold block">{formatCurrency(p.amount)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase inline-block mt-0.5 ${
                      p.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-400 font-semibold text-xs">
                No financial records logged.
              </div>
            )}
          </div>
        </div>

        {/* Assign Influencer Dialog Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 z-10">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Assign Creator to Campaign</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {unassignedInfluencers.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  All available database influencers are already assigned to this campaign.
                </div>
              ) : (
                <form onSubmit={handleAssignInfluencer} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Creator</label>
                    <select
                      value={selectedInfluencerId}
                      onChange={e => setSelectedInfluencerId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300"
                    >
                      {unassignedInfluencers.map(inf => (
                        <option key={inf.id} value={inf.id}>
                          {inf.full_name} (@{inf.username}) - {formatNumber(inf.followers)} followers
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">payout Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={assigning}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md flex justify-center items-center gap-1"
                  >
                    {assigning ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    Assign Creator & Create Voucher
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
