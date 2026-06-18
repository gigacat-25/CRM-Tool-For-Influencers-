"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Search,
  Plus,
  Briefcase,
  Layers,
  DollarSign,
  TrendingUp,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Trash2,
  Edit2,
  Eye,
  X,
  FileText,
  Activity,
  PlusCircle,
  Loader2
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

export default function BrandsPage() {
  const { pushToast } = useNotifications();

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Detailed Brand Modal State
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<"campaigns" | "timeline">("campaigns");

  // Interaction logs forms
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Add/Edit Forms State
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBrandId, setEditBrandId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formBudget, setFormBudget] = useState("₹500,000 - ₹2,000,000");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadBrands = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }

      const res = await fetch("/api/brands");
      if (res.ok) {
        const json = await res.json();
        setBrands(json.brands);
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleBrandClick = async (brandId: string) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    setDetailTab("campaigns");
    try {
      const res = await fetch(`/api/brands/${brandId}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedBrand(json.brand);
      }
    } catch {
      pushToast({ type: "error", title: "Error", message: "Failed to load brand details." });
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCompany) {
      pushToast({ type: "error", title: "Validation Error", message: "Brand name and Company name are required." });
      return;
    }

    const payload = {
      name: formName,
      company_name: formCompany,
      industry: formIndustry,
      contact_person: formContact,
      designation: formDesignation,
      email: formEmail,
      phone: formPhone,
      website: formWebsite,
      budget_range: formBudget,
      address: formAddress,
      notes: formNotes
    };

    try {
      let res;
      if (isEditMode && editBrandId) {
        res = await fetch(`/api/brands/${editBrandId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        pushToast({
          type: "success",
          title: isEditMode ? "Brand Updated" : "Brand Created",
          message: `Successfully saved ${formName}.`
        });
        resetForm();
        setShowFormModal(false);
        loadBrands();
        // If updating the selected brand, refresh details
        if (isEditMode && editBrandId && selectedBrand?.id === editBrandId) {
          handleBrandClick(editBrandId);
        }
      }
    } catch {
      pushToast({ type: "error", title: "Error", message: "Failed to save brand partner profile." });
    }
  };

  const handleEditClick = (brand: any) => {
    setIsEditMode(true);
    setEditBrandId(brand.id);
    setFormName(brand.name);
    setFormCompany(brand.company_name);
    setFormIndustry(brand.industry || "");
    setFormContact(brand.contact_person || "");
    setFormDesignation(brand.designation || "");
    setFormEmail(brand.email || "");
    setFormPhone(brand.phone || "");
    setFormWebsite(brand.website || "");
    setFormBudget(brand.budget_range || "₹500,000 - ₹2,000,000");
    setFormAddress(brand.address || "");
    setFormNotes(brand.notes || "");
    
    setShowFormModal(true);
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete brand partner "${name}"? This deletes all associated campaigns.`)) return;

    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (res.ok) {
        pushToast({ type: "info", title: "Brand Deleted", message: `Removed "${name}" from database.` });
        if (selectedBrand?.id === id) {
          setShowDetailModal(false);
        }
        loadBrands();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Deletion Failed",
        message: err.message || "Failed to delete brand."
      });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedBrand) return;

    setNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: selectedBrand.id, content: noteContent })
      });

      if (res.ok) {
        pushToast({ type: "success", title: "Note Saved", message: "Logged internal brand note." });
        setNoteContent("");
        // Reload details
        const detailsRes = await fetch(`/api/brands/${selectedBrand.id}`);
        if (detailsRes.ok) {
          const json = await detailsRes.json();
          setSelectedBrand(json.brand);
        }
      }
    } catch {
      pushToast({ type: "error", title: "Error", message: "Failed to save note." });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditBrandId(null);
    setFormName("");
    setFormCompany("");
    setFormIndustry("");
    setFormContact("");
    setFormDesignation("");
    setFormEmail("");
    setFormPhone("");
    setFormWebsite("");
    setFormBudget("₹500,000 - ₹2,000,000");
    setFormAddress("");
    setFormNotes("");
  };

  const filteredBrands = brands.filter(
    brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand.industry && brand.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Brand CRM</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage corporate partnerships, budget limits, spend history, and primary brand contacts.
            </p>
          </div>

          {currentUser?.role !== "viewer" && (
            <button
              onClick={() => {
                resetForm();
                setShowFormModal(true);
              }}
              className="flex items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Brand Partner
            </button>
          )}
        </div>

        {/* Search Toolbar */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by brand name, company, industry..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500 text-foreground"
            />
          </div>
        </div>

        {/* Brands Directory grid */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10 text-zinc-400 font-bold uppercase tracking-wider text-[9px] p-3">
                  <th className="p-3">Brand</th>
                  <th className="p-3">Industry</th>
                  <th className="p-3 text-center">Active Campaigns</th>
                  <th className="p-3">Total Spend</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map(brand => (
                    <tr key={brand.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{brand.name}</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">{brand.company_name}</span>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300 font-medium">{brand.industry || "General"}</td>
                      <td className="p-3 text-center font-bold text-indigo-500">{brand.active_campaigns}</td>
                      <td className="p-3 font-bold">{formatCurrency(brand.total_spend)}</td>
                      <td className="p-3">
                        {brand.contact_person ? (
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{brand.contact_person}</span>
                            <span className="text-[10px] text-zinc-400 block">{brand.designation}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => handleBrandClick(brand.id)}
                          className="p-1 hover:bg-secondary text-zinc-400 hover:text-foreground rounded transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {currentUser?.role !== "viewer" && (
                          <button
                            onClick={() => handleEditClick(brand)}
                            className="p-1 hover:bg-secondary text-zinc-400 hover:text-foreground rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {currentUser?.role === "super_admin" && (
                          <button
                            onClick={() => handleDeleteBrand(brand.id, brand.name)}
                            className="p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-500 text-xs font-semibold">
                      No brand partners found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Brand Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Briefcase className="h-4.5 w-4.5 text-indigo-500" />
                    {selectedBrand ? selectedBrand.name : "Loading..."}
                  </h3>
                  <span className="text-[10px] text-zinc-500">{selectedBrand?.company_name}</span>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingDetail || !selectedBrand ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aggregated KPIs */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-secondary/40 p-3 rounded-xl border border-border">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Spend</span>
                      <span className="text-sm font-extrabold mt-1 block">
                        {formatCurrency(
                          selectedBrand.campaigns
                            .filter((c: any) => c.stage === "Running" || c.stage === "Completed")
                            .reduce((sum: number, c: any) => sum + (c.budget || 0), 0)
                        )}
                      </span>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded-xl border border-border">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Active Projects</span>
                      <span className="text-sm font-extrabold mt-1 block text-indigo-500">
                        {selectedBrand.campaigns.filter((c: any) => c.stage === "Running").length}
                      </span>
                    </div>
                    <div className="bg-secondary/40 p-3 rounded-xl border border-border">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Completed</span>
                      <span className="text-sm font-extrabold mt-1 block text-emerald-500">
                        {selectedBrand.campaigns.filter((c: any) => c.stage === "Completed").length}
                      </span>
                    </div>
                  </div>

                  {/* Core Details grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 border border-border p-4 rounded-xl text-xs font-semibold">
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block tracking-wider">Contact Person</span>
                      <span className="text-zinc-800 dark:text-zinc-200 block">{selectedBrand.contact_person || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block tracking-wider">Designation</span>
                      <span className="text-zinc-800 dark:text-zinc-200 block">{selectedBrand.designation || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block tracking-wider">Email</span>
                      <span className="text-zinc-800 dark:text-zinc-200 block truncate">{selectedBrand.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase block tracking-wider">Phone</span>
                      <span className="text-zinc-800 dark:text-zinc-200 block">{selectedBrand.phone || "N/A"}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[9px] text-zinc-400 uppercase block tracking-wider">Office Address</span>
                      <span className="text-zinc-800 dark:text-zinc-200 block">{selectedBrand.address || "N/A"}</span>
                    </div>
                  </div>

                  {/* Modal tabs */}
                  <div className="flex border-b border-border text-xs font-semibold text-zinc-500 gap-4">
                    <button
                      onClick={() => setDetailTab("campaigns")}
                      className={`pb-2 cursor-pointer ${detailTab === "campaigns" ? "border-b-2 border-primary text-primary" : ""}`}
                    >
                      Campaign History ({selectedBrand.campaigns.length})
                    </button>
                    <button
                      onClick={() => setDetailTab("timeline")}
                      className={`pb-2 cursor-pointer ${detailTab === "timeline" ? "border-b-2 border-primary text-primary" : ""}`}
                    >
                      Internal Timeline ({selectedBrand.notes.length})
                    </button>
                  </div>

                  {detailTab === "campaigns" ? (
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                      {selectedBrand.campaigns.length > 0 ? (
                        selectedBrand.campaigns.map((camp: any) => (
                          <div key={camp.id} className="flex justify-between items-center p-3 border border-border rounded-xl text-xs hover:bg-secondary/40 transition-colors">
                            <div>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{camp.name}</span>
                              <span className="text-[9px] text-zinc-500 mt-0.5 block">
                                {camp.start_date} to {camp.end_date} | {camp.type}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold block">{formatCurrency(camp.budget)}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block mt-0.5 ${
                                camp.stage === "Running"
                                  ? "bg-indigo-500/10 text-indigo-500"
                                  : camp.stage === "Completed"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-zinc-500/10 text-zinc-500"
                              }`}>
                                {camp.stage}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-400 font-semibold text-xs">
                          No campaigns run for this brand yet.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Log Note form */}
                      {currentUser?.role !== "viewer" && (
                        <form onSubmit={handleAddNote} className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            placeholder="Add internal note regarding client interactions..."
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={noteSubmitting}
                            className="py-1.5 px-3 bg-primary text-white rounded-xl text-xs font-semibold hover:opacity-95 shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {noteSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                            Log
                          </button>
                        </form>
                      )}

                      {/* Notes feed */}
                      <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                        {selectedBrand.notes.length > 0 ? (
                          selectedBrand.notes.map((note: any) => (
                            <div key={note.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-border rounded-xl text-xs space-y-1">
                              <p className="text-zinc-700 dark:text-zinc-300 font-medium">{note.content}</p>
                              <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold">
                                <span>Logged by: {note.user_name}</span>
                                <span>{new Date(note.created_at).toLocaleDateString("en-IN")}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-zinc-400 font-semibold text-xs">
                            No internal interaction logs recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Brand Modal Form */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
            <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">{isEditMode ? `Edit Brand Partner` : "Add New Brand Partner"}</h3>
                <button onClick={() => setShowFormModal(false)} className="text-zinc-500 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Brand Identifier Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nike"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Corporate Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nike India Pvt Ltd"
                      value={formCompany}
                      onChange={e => setFormCompany(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Industry Vertical</label>
                    <input
                      type="text"
                      placeholder="e.g. Sports & Apparel"
                      value={formIndustry}
                      onChange={e => setFormIndustry(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Budget Range Scale</label>
                    <select
                      value={formBudget}
                      onChange={e => setFormBudget(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300"
                    >
                      <option value="₹100,000 - ₹500,000">₹100k - ₹500k</option>
                      <option value="₹500,000 - ₹2,000,000">₹500k - ₹2M</option>
                      <option value="₹2,000,000 - ₹5,000,000">₹2M - ₹5M</option>
                      <option value="₹5,000,000 - ₹10,000,000">₹5M - ₹10M</option>
                      <option value="₹10,000,000+">₹10M+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohit Sharma"
                      value={formContact}
                      onChange={e => setFormContact(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Marketing Director"
                      value={formDesignation}
                      onChange={e => setFormDesignation(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 XXXXX XXXXX"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://company.com"
                      value={formWebsite}
                      onChange={e => setFormWebsite(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Office Address</label>
                    <input
                      type="text"
                      placeholder="Building, Area, City..."
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">General Notes</label>
                    <textarea
                      placeholder="Log key specifications or client preferences..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-16 resize-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90"
                  >
                    {isEditMode ? "Save Changes" : "Create Profile"}
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
