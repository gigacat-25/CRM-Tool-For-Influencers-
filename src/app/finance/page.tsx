"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  DollarSign,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Users,
  Briefcase,
  FileText,
  X,
  TrendingUp,
  Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/notification-provider";

// Helper for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function FinancePage() {
  const router = useRouter();
  const { pushToast } = useNotifications();

  // Session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "brand" | "influencer">("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // Form states
  const [formType, setFormType] = useState<"brand_payment" | "influencer_payout">("influencer_payout");
  const [formCampaignId, setFormCampaignId] = useState("");
  const [formInfluencerId, setFormInfluencerId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState("Pending");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formInvoiceUrl, setFormInvoiceUrl] = useState("");

  const loadData = async () => {
    try {
      // 1. Get Session User
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        
        // If not admin or super admin, block access and redirect
        if (meJson.user.role !== "admin" && meJson.user.role !== "super_admin") {
          pushToast({
            type: "error",
            title: "Access Denied",
            message: "You do not have permission to view the Finance Ledger."
          });
          router.push("/dashboard");
          return;
        }
        
        setCurrentUser(meJson.user);
      } else {
        router.push("/login");
        return;
      }

      // 2. Get Payments
      const payRes = await fetch("/api/finance");
      if (payRes.ok) {
        const payJson = await payRes.json();
        setPayments(payJson.payments);
      }

      // 3. Get campaigns, influencers, brands for select menus
      const campRes = await fetch("/api/campaigns");
      if (campRes.ok) {
        const campJson = await campRes.json();
        setCampaigns(campJson.campaigns);
      }

      const infRes = await fetch("/api/influencers");
      if (infRes.ok) {
        const infJson = await infRes.json();
        setInfluencers(infJson.influencers);
      }

      const brandRes = await fetch("/api/brands");
      if (brandRes.ok) {
        const brandJson = await brandRes.json();
        setBrands(brandJson.brands);
      }
    } catch (err) {
      console.error("Failed to load finance data:", err);
      pushToast({
        type: "error",
        title: "Load Error",
        message: "Failed to load financial records."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      pushToast({
        type: "error",
        title: "Validation Error",
        message: "Please enter a valid amount."
      });
      return;
    }

    const payload = {
      campaign_id: formCampaignId || null,
      influencer_id: formType === "influencer_payout" ? formInfluencerId : null,
      brand_id: formType === "brand_payment" ? formBrandId : null,
      amount: parseFloat(formAmount),
      type: formType,
      status: formStatus,
      due_date: formDueDate || new Date().toISOString().split("T")[0],
      notes: formNotes,
      invoice_url: formInvoiceUrl
    };

    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Record Saved",
          message: "Transaction logged successfully."
        });
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error);
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Submit Failed",
        message: err.message || "Failed to log transaction."
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Payment Updated",
          message: `Status set to ${newStatus}.`
        });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Update Failed",
        message: "Failed to update payment status."
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      const res = await fetch(`/api/finance/${editingPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formStatus,
          notes: formNotes,
          invoice_url: formInvoiceUrl
        })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Changes Saved",
          message: "Payment record updated successfully."
        });
        setShowEditModal(false);
        setEditingPayment(null);
        resetForm();
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Update Failed",
        message: "Failed to save record updates."
      });
    }
  };

  const handleDeletePayment = async (id: string, desc: string) => {
    if (!confirm(`Are you sure you want to permanently delete transaction "${desc}"?`)) return;

    try {
      const res = await fetch(`/api/finance/${id}`, { method: "DELETE" });
      if (res.ok) {
        pushToast({
          type: "info",
          title: "Record Deleted",
          message: "Transaction deleted from ledger."
        });
        loadData();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Access Blocked",
        message: err.message || "Deletions require Super Admin role."
      });
    }
  };

  const resetForm = () => {
    setFormCampaignId("");
    setFormInfluencerId("");
    setFormBrandId("");
    setFormAmount("");
    setFormStatus("Pending");
    setFormDueDate("");
    setFormNotes("");
    setFormInvoiceUrl("");
  };

  const handleEditClick = (pay: any) => {
    setEditingPayment(pay);
    setFormStatus(pay.status);
    setFormNotes(pay.notes || "");
    setFormInvoiceUrl(pay.invoice_url || "");
    setShowEditModal(true);
  };

  // Financial calculations
  const brandCompleted = payments
    .filter(p => p.type === "brand_payment" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const brandPending = payments
    .filter(p => p.type === "brand_payment" && p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBrandRevenue = brandCompleted + brandPending; // Total invoiced volume

  const payoutCompleted = payments
    .filter(p => p.type === "influencer_payout" && p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const payoutPending = payments
    .filter(p => p.type === "influencer_payout" && p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayoutCost = payoutCompleted + payoutPending;

  const netMargin = totalBrandRevenue - totalPayoutCost;
  const marginPercentage = totalBrandRevenue > 0 ? (netMargin / totalBrandRevenue) * 100 : 0;

  // Filter payments list
  let filteredPayments = payments.filter(pay => {
    // Type Filter
    if (activeTab === "brand" && pay.type !== "brand_payment") return false;
    if (activeTab === "influencer" && pay.type !== "influencer_payout") return false;

    // Status Filter
    if (statusFilter !== "all" && pay.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

    // Text Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCampaign = pay.campaign_name?.toLowerCase().includes(q);
      const matchNotes = pay.notes?.toLowerCase().includes(q);
      const matchBrand = pay.brand_name?.toLowerCase().includes(q);
      const matchInf = pay.influencer_name?.toLowerCase().includes(q);
      return matchCampaign || matchNotes || matchBrand || matchInf;
    }

    return true;
  });

  // CSV Export helper
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ["ID", "Due Date", "Paid Date", "Type", "Subject / Campaign", "Partner Name", "Amount (₹)", "Status", "Notes"];
    const rows = filteredPayments.map(p => [
      p.id,
      p.due_date || "",
      p.paid_date || "",
      p.type === "brand_payment" ? "Brand Invoice" : "Influencer Payout",
      p.campaign_name,
      p.type === "brand_payment" ? p.brand_name : p.influencer_name,
      p.amount,
      p.status,
      p.notes || ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SceneCo_Finance_Ledger_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    pushToast({
      type: "success",
      title: "Ledger Exported",
      message: `Downloaded CSV ledger details for ${filteredPayments.length} transactions.`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-indigo-500" />
              Finance Ledger
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Track agency inbound invoices, influencer payouts, project margins, and pending dues.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            {currentUser?.role !== "viewer" && (
              <button
                onClick={() => {
                  resetForm();
                  if (campaigns.length > 0) setFormCampaignId(campaigns[0].id);
                  if (influencers.length > 0) setFormInfluencerId(influencers[0].id);
                  if (brands.length > 0) setFormBrandId(brands[0].id);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Record
              </button>
            )}
          </div>
        </div>

        {/* Summary Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Brand Revenue (Invoiced)</span>
              <div className="p-1 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-foreground">{formatCurrency(totalBrandRevenue)}</h3>
            <div className="flex gap-2 text-[10px] text-zinc-500">
              <span className="text-emerald-500 font-bold">{formatCurrency(brandCompleted)} cleared</span>
              <span>• {formatCurrency(brandPending)} pending</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Creator Payout Dues</span>
              <div className="p-1 bg-rose-500/10 text-rose-500 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-rose-500">{formatCurrency(payoutPending)}</h3>
            <div className="flex gap-2 text-[10px] text-zinc-500">
              <span className="text-zinc-500 font-semibold">{formatCurrency(payoutCompleted)} paid</span>
              <span>• Total: {formatCurrency(totalPayoutCost)}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gross Operating Profit</span>
              <div className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-emerald-500">{formatCurrency(netMargin)}</h3>
            <div className="flex gap-2 text-[10px] text-zinc-500">
              <span>Brand Revenue minus Payout costs</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gross Profit Margin</span>
              <div className="p-1 bg-violet-500/10 text-violet-500 rounded-lg">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-violet-500">{marginPercentage.toFixed(1)}%</h3>
            <div className="flex gap-2 text-[10px] text-zinc-500">
              <span>Average margins per campaigns</span>
            </div>
          </div>
        </div>

        {/* Filters and List tabs */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tab Selector */}
          <div className="flex bg-secondary/30 border border-border/60 rounded-xl p-0.5 w-full md:w-auto shrink-0 select-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"
              }`}
            >
              All Ledger
            </button>
            <button
              onClick={() => setActiveTab("brand")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "brand" ? "bg-card text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"
              }`}
            >
              Brand Payments
            </button>
            <button
              onClick={() => setActiveTab("influencer")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "influencer" ? "bg-card text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"
              }`}
            >
              Influencer Payouts
            </button>
          </div>

          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:flex-1 md:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search description, campaign..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none placeholder-zinc-500 text-foreground"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Campaign / Purpose</th>
                  <th className="py-3 px-4">Partner details</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[10px] font-bold text-zinc-400">
                        {pay.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {pay.due_date || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {pay.type === "brand_payment" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                            <ArrowDownLeft className="h-3.5 w-3.5 bg-indigo-500/10 p-0.5 rounded" />
                            Brand Invoice
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                            <ArrowUpRight className="h-3.5 w-3.5 bg-rose-500/10 p-0.5 rounded" />
                            Creator Payout
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{pay.campaign_name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{pay.notes || "No additional notes"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        {pay.type === "brand_payment" ? (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-zinc-400" />
                            {pay.brand_name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-zinc-400" />
                            {pay.influencer_name} (@{pay.influencer_username})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-foreground">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {pay.status === "Completed" ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          ) : pay.status === "Failed" ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                              <Clock className="h-3 w-3 animate-pulse" />
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Mark Completed */}
                          {pay.status === "Pending" && (
                            <button
                              onClick={() => handleUpdateStatus(pay.id, "Completed")}
                              className="text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/5 px-2 py-1 border border-emerald-500/20 rounded-lg cursor-pointer"
                            >
                              Pay/Clear
                            </button>
                          )}
                          
                          {/* View Invoice document link */}
                          {pay.invoice_url && (
                            <a
                              href={pay.invoice_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 border border-border hover:bg-secondary/40 text-zinc-500 hover:text-foreground rounded-lg cursor-pointer"
                              title="View Invoice"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => handleEditClick(pay)}
                            className="p-1.5 border border-border hover:bg-secondary/40 text-zinc-500 hover:text-foreground rounded-lg cursor-pointer"
                            title="Edit Ledger Details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete (Super Admin only) */}
                          {currentUser?.role === "super_admin" && (
                            <button
                              onClick={() => handleDeletePayment(pay.id, `${pay.type === "brand_payment" ? pay.brand_name : pay.influencer_name} - ${pay.campaign_name}`)}
                              className="p-1.5 border border-rose-500/20 hover:bg-rose-500/5 text-zinc-400 hover:text-rose-500 rounded-lg cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-semibold text-xs">
                      No financial records found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Record Payment / Invoice</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Transaction Type */}
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Ledger Entry Type</label>
                    <div className="flex bg-secondary/30 rounded-xl p-0.5 border border-border/50">
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("influencer_payout");
                          resetForm();
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                          formType === "influencer_payout" ? "bg-card text-foreground shadow-sm" : "text-zinc-500"
                        }`}
                      >
                        Creator Payout (Outbound)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("brand_payment");
                          resetForm();
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                          formType === "brand_payment" ? "bg-card text-foreground shadow-sm" : "text-zinc-500"
                        }`}
                      >
                        Client Invoice (Inbound)
                      </button>
                    </div>
                  </div>

                  {/* Campaign dropdown */}
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Associated Campaign</label>
                    <select
                      value={formCampaignId}
                      onChange={e => setFormCampaignId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">No Campaign (Direct Transaction)</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Partner dynamic fields */}
                  {formType === "influencer_payout" ? (
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Influencer Partner</label>
                      <select
                        value={formInfluencerId}
                        onChange={e => setFormInfluencerId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {influencers.map(i => (
                          <option key={i.id} value={i.id}>{i.full_name} (@{i.username})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Brand Client</label>
                      <select
                        value={formBrandId}
                        onChange={e => setFormBrandId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Amount */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={e => setFormDueDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Status</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  {/* Invoice file link */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Invoice Doc Path</label>
                    <input
                      type="text"
                      placeholder="e.g. /invoices/zara_invoice.pdf"
                      value={formInvoiceUrl}
                      onChange={e => setFormInvoiceUrl(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Internal Notes</label>
                    <textarea
                      placeholder="Enter billing reference details, transaction IDs, etc..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-16 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
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
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditModal && editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Edit Payment Details</h3>
                <button onClick={() => setShowEditModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Invoice Document Path</label>
                  <input
                    type="text"
                    value={formInvoiceUrl}
                    onChange={e => setFormInvoiceUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Billing Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
