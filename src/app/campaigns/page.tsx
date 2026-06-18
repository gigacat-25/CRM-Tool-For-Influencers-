"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Layers,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Trash2,
  Edit2,
  X,
  Loader2,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  KanbanSquare,
  ChevronRight
} from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

// Helper for formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function CampaignsPage() {
  const router = useRouter();
  const { pushToast } = useNotifications();

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("kanban");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formType, setFormType] = useState("Instagram Reels");
  const [formBudget, setFormBudget] = useState("0");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formDeliverables, setFormDeliverables] = useState("");
  const [formObjectives, setFormObjectives] = useState("");

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }

      const campRes = await fetch("/api/campaigns");
      if (campRes.ok) {
        const campJson = await campRes.json();
        setCampaigns(campJson.campaigns);
      }

      const brandRes = await fetch("/api/brands");
      if (brandRes.ok) {
        const brandJson = await brandRes.json();
        setBrands(brandJson.brands);
        if (brandJson.brands.length > 0) {
          setFormBrandId(brandJson.brands[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load campaigns data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBrandId) {
      pushToast({
        type: "error",
        title: "Validation Error",
        message: "Campaign name and client brand are required."
      });
      return;
    }

    const payload = {
      name: formName,
      brand_id: formBrandId,
      type: formType,
      budget: parseFloat(formBudget) || 0,
      start_date: formStartDate,
      end_date: formEndDate,
      deliverables: formDeliverables,
      objectives: formObjectives
    };

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Campaign Created",
          message: `Successfully drafted campaign "${formName}".`
        });
        setShowAddModal(false);
        resetForm();
        loadData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to create campaign."
      });
    }
  };

  const updateCampaignStage = async (id: string, name: string, nextStage: string) => {
    // Find current campaign fields to keep them
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: camp.name,
          type: camp.type,
          budget: camp.budget,
          start_date: camp.start_date,
          end_date: camp.end_date,
          deliverables: camp.deliverables,
          objectives: camp.objectives,
          stage: nextStage
        })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Stage Updated",
          message: `"${name}" moved to ${nextStage}.`
        });
        loadData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to update campaign stage."
      });
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete campaign "${name}"? This deletes all assignments and payment records.`)) return;

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        pushToast({
          type: "info",
          title: "Campaign Deleted",
          message: `Removed campaign "${name}" from database.`
        });
        loadData();
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Access Denied",
        message: err.message || "Deletions require Super Admin permissions."
      });
    }
  };

  const resetForm = () => {
    setFormName("");
    if (brands.length > 0) setFormBrandId(brands[0].id);
    setFormType("Instagram Reels");
    setFormBudget("0");
    setFormStartDate("");
    setFormEndDate("");
    setFormDeliverables("");
    setFormObjectives("");
  };

  const stages = ["Draft", "Planning", "Outreach", "Negotiation", "Approved", "Running", "Completed", "Cancelled"];

  const filteredCampaigns = campaigns.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.type && c.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Campaigns</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Organize, track outreach pipelines, and monitor deliverables completion on brand campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border border-border rounded-xl overflow-hidden p-0.5 bg-card">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === "grid" ? "bg-secondary text-foreground" : "text-zinc-500 hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === "kanban" ? "bg-secondary text-foreground" : "text-zinc-500 hover:text-foreground"
                }`}
              >
                <KanbanSquare className="h-4 w-4" />
              </button>
            </div>

            {/* Add Campaign */}
            {currentUser?.role !== "viewer" && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Campaign
              </button>
            )}
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by campaign name, brand client..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500 text-foreground"
            />
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map(camp => (
                <div key={camp.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {camp.client_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        camp.stage === "Running"
                          ? "bg-indigo-500/10 text-indigo-500"
                          : camp.stage === "Completed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : camp.stage === "Cancelled"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-zinc-500/10 text-zinc-500"
                      }`}>
                        {camp.stage}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1">{camp.name}</h3>
                    <p className="text-[11px] text-zinc-500">{camp.type}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase">Budget</span>
                      <span>{formatCurrency(camp.budget)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase">Creators</span>
                      <span>{camp.influencers_count} assigned</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase">End Date</span>
                      <span>{camp.end_date || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-border/60 mt-2">
                    <button
                      onClick={() => router.push(`/campaigns/${camp.id}`)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer"
                    >
                      Workspace
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    
                    {currentUser?.role === "super_admin" && (
                      <button
                        onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                        className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-zinc-500 text-xs font-semibold">
                No campaigns found.
              </div>
            )}
          </div>
        )}

        {/* Kanban Board View */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4 select-none scrollbar-none h-[calc(100vh-280px)]">
            {stages.map(stage => {
              const stageCamps = filteredCampaigns.filter(c => c.stage.toLowerCase() === stage.toLowerCase());
              return (
                <div key={stage} className="flex flex-col w-72 shrink-0 bg-secondary/20 dark:bg-zinc-900/10 border border-border/60 rounded-2xl p-3 max-h-full">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{stage}</span>
                      <div className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-zinc-500">
                        {stageCamps.length}
                      </div>
                    </div>
                  </div>

                  {/* Cards list */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
                    {stageCamps.length > 0 ? (
                      stageCamps.map(camp => (
                        <div key={camp.id} className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer" onClick={() => router.push(`/campaigns/${camp.id}`)}>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                              {camp.client_name}
                            </span>
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 line-clamp-1 mt-0.5">{camp.name}</h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{camp.type}</p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] pt-2 border-t border-border/60 font-semibold text-zinc-500">
                            <span>{formatCurrency(camp.budget)}</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {camp.influencers_count}
                            </span>
                          </div>

                          {/* Quick Stage Change inside Kanban for Review */}
                          {currentUser?.role !== "viewer" && (
                            <div className="pt-2 border-t border-border/60 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                              <select
                                value={camp.stage}
                                onChange={e => updateCampaignStage(camp.id, camp.name, e.target.value)}
                                className="bg-background border border-border text-[9px] font-bold rounded-lg px-1.5 py-1 text-zinc-500"
                              >
                                {stages.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                              
                              {currentUser?.role === "super_admin" && (
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                                  className="p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 rounded transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-zinc-400 text-[10px] font-medium border border-dashed border-border rounded-xl">
                        No campaigns in {stage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Campaign Modal Form */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Draft New Campaign</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {brands.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-zinc-500">You need to add a Brand Partner to the CRM before drafting campaigns.</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      router.push("/brands");
                    }}
                    className="py-1.5 px-3 bg-primary text-white text-xs font-semibold rounded-xl"
                  >
                    Go to Brand CRM
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Campaign Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Zara Linen Summer Collection"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Brand Client</label>
                      <select
                        value={formBrandId}
                        onChange={e => setFormBrandId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Campaign Format</label>
                      <input
                        type="text"
                        placeholder="e.g. Unboxing, Outfit Reels"
                        value={formType}
                        onChange={e => setFormType(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Allocated Budget (₹)</label>
                      <input
                        type="number"
                        value={formBudget}
                        onChange={e => setFormBudget(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formStartDate}
                        onChange={e => setFormStartDate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">End Date</label>
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={e => setFormEndDate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Campaign Deliverables Checklist</label>
                      <textarea
                        placeholder="e.g. 1 Integration Video, 2 Story sets with links..."
                        value={formDeliverables}
                        onChange={e => setFormDeliverables(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-16 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Core Campaign Objectives</label>
                      <textarea
                        placeholder="Define conversion goals, reach KPIs..."
                        value={formObjectives}
                        onChange={e => setFormObjectives(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-16 resize-none"
                      />
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90"
                    >
                      Draft Project
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
