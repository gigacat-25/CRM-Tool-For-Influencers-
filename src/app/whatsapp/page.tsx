"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Users,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Smartphone,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText
} from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

// Helper for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function WhatsAppPage() {
  const { pushToast } = useNotifications();

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [outreachList, setOutreachList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filters & Selection
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Template states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("pitch");
  const [messageText, setMessageText] = useState("");

  // Load Data
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

      const outRes = await fetch("/api/whatsapp");
      if (outRes.ok) {
        const outJson = await outRes.json();
        setOutreachList(outJson.campaign_influencers);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp data:", err);
      pushToast({
        type: "error",
        title: "Load Error",
        message: "Failed to load outreach records."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredList = outreachList.filter(item => {
    const matchesCampaign = selectedCampaignId === "all" || item.campaign_id === selectedCampaignId;
    const matchesSearch =
      item.influencer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.influencer_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCampaign && matchesSearch;
  });

  const selectedItem = filteredList[selectedItemIndex] || null;

  // Templates Definition
  const templates = [
    {
      id: "pitch",
      name: "First Outreach / Pitch",
      subject: "Collaboration Invitation",
      body: "Hi {Creator Name},\n\nLove your content on Instagram! This is {Sender Name} from The Scene Co. \n\nWe are running an exciting campaign for {Brand Name} - '{Campaign Name}' and would love to collaborate with you for {Deliverables}.\n\nLet me know if you're interested and we can discuss the next steps! \n\nBest,\n{Sender Name}"
    },
    {
      id: "followup",
      name: "Follow-up Reminder",
      subject: "Follow-up on Collaboration",
      body: "Hey {Creator Name},\n\nJust following up on our collab invite for {Brand Name}! We're finalizing our roster this week and would love to have you on board. \n\nLet me know if you'd be interested! \n\nBest,\n{Sender Name}"
    },
    {
      id: "barter",
      name: "Barter Campaign Offer",
      subject: "Gifting Collaboration",
      body: "Hi {Creator Name},\n\nHope you're doing well! We have a special gifting barter campaign for {Brand Name} where we ship you their latest collection in exchange for {Deliverables}.\n\nIf you love the brand and want to collab, share your shipping address and contact number!\n\nCheers,\n{Sender Name}"
    },
    {
      id: "brief",
      name: "Campaign Brief & Deliverables",
      subject: "Campaign Brief Details",
      body: "Hey {Creator Name},\n\nThrilled to have you on board for {Brand Name} - '{Campaign Name}'!\n\nHere are the deliverables for this run:\n- {Deliverables}\n- Payout: {Payout Budget}\n\nPlease share the draft/preview of your content with us for approval before going live. Let's make this amazing!\n\nBest,\n{Sender Name}"
    },
    {
      id: "invoice",
      name: "Invoice & Payment Request",
      subject: "Deliverables Completed - Invoice",
      body: "Hi {Creator Name},\n\nAwesome job on the deliverables for the {Brand Name} campaign!\n\nPlease share your bank details and invoice for {Payout Budget} so we can process your payout.\n\nThank you for working with us!\n\nBest,\n{Sender Name}"
    }
  ];

  // Update generated text when item or template changes
  useEffect(() => {
    if (selectedItem) {
      const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
      let body = activeTemplate.body;

      // Replace placeholders
      body = body.replace(/{Creator Name}/g, selectedItem.influencer_name);
      body = body.replace(/{Sender Name}/g, currentUser?.name || "The Scene Co.");
      body = body.replace(/{Brand Name}/g, selectedItem.brand_name);
      body = body.replace(/{Campaign Name}/g, selectedItem.campaign_name);
      body = body.replace(/{Deliverables}/g, selectedItem.deliverables || "1 Instagram Reels");
      body = body.replace(/{Payout Budget}/g, formatCurrency(selectedItem.payment_amount));

      setMessageText(body);
    } else {
      setMessageText("");
    }
  }, [selectedItem, selectedTemplateId, currentUser]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedItem) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: selectedItem.campaign_id,
          influencer_id: selectedItem.influencer_id,
          status: newStatus
        })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Status Updated",
          message: `Updated status for ${selectedItem.influencer_name} to ${newStatus}.`
        });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Update Failed",
        message: "Failed to update outreach status."
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    pushToast({
      type: "info",
      title: "Copied",
      message: "Message content copied to clipboard."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerWhatsApp = (mode: "web" | "api") => {
    if (!selectedItem) return;
    const phone = selectedItem.influencer_phone?.replace(/[^0-9]/g, "");

    if (!phone) {
      pushToast({
        type: "error",
        title: "Missing Phone Number",
        message: `${selectedItem.influencer_name} does not have a phone number in their profile.`
      });
      return;
    }

    const encodedText = encodeURIComponent(messageText);
    let url = "";
    if (mode === "web") {
      url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    } else {
      url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    }

    window.open(url, "_blank");

    // Auto update status logically
    let nextStatus = selectedItem.status;
    if (selectedItem.status === "Assigned") {
      nextStatus = "Contacted";
    } else if (selectedItem.status === "Contacted" && selectedTemplateId === "followup") {
      nextStatus = "Negotiating";
    }

    // Auto-save outreach activity
    logOutreachActivity(nextStatus);
  };

  const logOutreachActivity = async (targetStatus: string) => {
    if (!selectedItem) return;
    
    try {
      // Log activity
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_id: selectedItem.influencer_id,
          campaign_id: selectedItem.campaign_id,
          type: "whatsapp",
          content: `WhatsApp outreach sent using template: "${templates.find(t => t.id === selectedTemplateId)?.name}". Message: ${messageText.substring(0, 100)}...`
        })
      });

      // Update outreach status if progressed
      if (targetStatus !== selectedItem.status && currentUser?.role !== "viewer") {
        await fetch("/api/whatsapp", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: selectedItem.campaign_id,
            influencer_id: selectedItem.influencer_id,
            status: targetStatus
          })
        });
      }

      loadData();
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  };

  // Status Badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
      case "Contacted":
        return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
      case "Negotiating":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "Approved":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "Declined":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-500" />
              WhatsApp Outreach Desk
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select assigned campaign influencers, generate custom templates, and log messages with one-click sends.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">
            {/* Left Panel: Creator List (3 cols) */}
            <div className="lg:col-span-4 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              {/* Campaign Filter & Search */}
              <div className="p-4 border-b border-border space-y-3 shrink-0">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Filter by Campaign
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={e => {
                      setSelectedCampaignId(e.target.value);
                      setSelectedItemIndex(0);
                    }}
                    className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setSelectedItemIndex(0);
                    }}
                    placeholder="Search by creator name..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none placeholder-zinc-500 text-foreground"
                  />
                </div>
              </div>

              {/* Creators Queue */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/60 scrollbar-none">
                {filteredList.length > 0 ? (
                  filteredList.map((item, idx) => (
                    <button
                      key={`${item.campaign_id}_${item.influencer_id}`}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`w-full text-left p-3.5 transition-all hover:bg-secondary/40 flex items-center justify-between border-l-2 cursor-pointer ${
                        selectedItemIndex === idx
                          ? "bg-secondary/60 border-l-indigo-500"
                          : "border-l-transparent text-zinc-500"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {item.influencer_name}
                        </h4>
                        <span className="text-[10px] text-zinc-500 block truncate font-medium">
                          @{item.influencer_username} • {item.campaign_name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-20 text-xs text-zinc-500 font-semibold px-4">
                    No creators assigned matching the criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Middle Panel: Workspace & Message Editor (5 cols) */}
            <div className="lg:col-span-5 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              {selectedItem ? (
                <div className="p-5 flex flex-col h-full overflow-y-auto scrollbar-none">
                  {/* Creator details */}
                  <div className="pb-4 border-b border-border/80 shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                          {selectedItem.brand_name} Campaign
                        </span>
                        <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-0.5">
                          {selectedItem.influencer_name}
                        </h2>
                        <a
                          href={`/influencers/${selectedItem.influencer_id}`}
                          className="text-[10px] text-zinc-500 hover:text-indigo-500 font-semibold flex items-center gap-1 mt-0.5"
                          target="_blank"
                          rel="noreferrer"
                        >
                          @{selectedItem.influencer_username}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-zinc-400 block font-bold uppercase">Outreach Status</span>
                        {currentUser?.role !== "viewer" ? (
                          <select
                            value={selectedItem.status}
                            disabled={updating}
                            onChange={e => handleUpdateStatus(e.target.value)}
                            className="bg-background border border-border text-[10px] font-bold rounded-lg px-2 py-1 text-zinc-600 dark:text-zinc-300 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="Assigned">Not Contacted (Assigned)</option>
                            <option value="Contacted">Outreach Sent (Contacted)</option>
                            <option value="Negotiating">Negotiating</option>
                            <option value="Approved">Approved</option>
                            <option value="Declined">Declined</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusBadge(selectedItem.status)}`}>
                            {selectedItem.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Campaign context strip */}
                    <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-secondary/30 rounded-xl border border-border/40 text-[11px]">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-bold uppercase">Deliverables</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-1">
                          {selectedItem.deliverables || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-bold uppercase">Compensation</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {selectedItem.payment_amount > 0 ? formatCurrency(selectedItem.payment_amount) : "Barter Collaboration"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messaging editor */}
                  <div className="flex-1 flex flex-col pt-4 min-h-[250px]">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Message Content
                      </span>
                      <button
                        onClick={handleCopyText}
                        className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy Draft
                      </button>
                    </div>

                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      className="w-full flex-1 bg-background border border-border rounded-xl p-3.5 text-xs text-foreground focus:outline-none resize-none font-mono leading-relaxed"
                    />

                    {/* Quick variables helper warning */}
                    {!selectedItem.influencer_phone && (
                      <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                        <span>This creator has no phone number listed. You can copy the message and send via Instagram or email.</span>
                      </div>
                    )}

                    {/* Sending actions */}
                    {selectedItem.influencer_phone && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={() => triggerWhatsApp("api")}
                          className="flex items-center justify-center gap-2 py-2 px-4 border border-border hover:bg-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                          Send via WA App
                        </button>
                        <button
                          onClick={() => triggerWhatsApp("web")}
                          className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          Send via WA Web
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-zinc-500 space-y-2">
                  <AlertCircle className="h-8 w-8 text-zinc-400" />
                  <p className="text-xs font-semibold">No Influencer Selected</p>
                  <p className="text-[10px] text-zinc-400">Select an influencer from the left queue to begin outreach.</p>
                </div>
              )}
            </div>

            {/* Right Panel: Outreach Templates & Logs (3 cols) */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              {/* Tabs / Templates list */}
              <div className="p-4 border-b border-border shrink-0">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Outreach Templates
                </h3>
                <div className="space-y-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full text-left p-2.5 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer block ${
                        selectedTemplateId === t.id
                          ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                          : "border-border hover:bg-secondary/40 text-zinc-500 hover:text-foreground"
                      }`}
                    >
                      <span className="block truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-none">
                <div>
                  <h4 className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Outreach Best Practices</h4>
                  <ul className="space-y-2 text-[11px] text-zinc-500 font-medium">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Always introduce the agency (The Scene Co.) and name-drop the client brand early.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Specify the exact deliverable format (Reels, Story, Carousel) to avoid scope creep.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Keep the message friendly, professional, and within 2-3 paragraphs.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-secondary/35 border border-border rounded-xl">
                  <div className="flex gap-2 text-[10px] text-zinc-500 leading-normal">
                    <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>Sending a WhatsApp opens an external window to dispatch, and automatically logs the outreach note in this creator's CRM history timeline.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
