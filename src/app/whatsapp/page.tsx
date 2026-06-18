"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Smartphone,
  AlertCircle,
  Users,
  ChevronDown
} from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

const formatCurrency = (amount: number) => {
  if (!amount || amount === 0) return "Barter / TBD";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function WhatsAppPage() {
  const { pushToast } = useNotifications();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignInfluencers, setCampaignInfluencers] = useState<any[]>([]);
  const [allInfluencers, setAllInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("pitch");
  const [messageText, setMessageText] = useState("");

  const loadData = async () => {
    try {
      const [meRes, campRes, outRes, infRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/campaigns"),
        fetch("/api/whatsapp"),
        fetch("/api/influencers")
      ]);

      if (meRes.ok) {
        const j = await meRes.json();
        setCurrentUser(j.user);
      }
      if (campRes.ok) {
        const j = await campRes.json();
        setCampaigns(j.campaigns || []);
      }
      if (outRes.ok) {
        const j = await outRes.json();
        setCampaignInfluencers(j.campaign_influencers || []);
      }
      if (infRes.ok) {
        const j = await infRes.json();
        setAllInfluencers(j.influencers || []);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp data:", err);
      pushToast({ type: "error", title: "Load Error", message: "Failed to load outreach records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Build a unified list: campaign-assigned first, then standalone influencers not in any campaign
  const buildOutreachList = () => {
    // Campaign-assigned records
    const ciItems = campaignInfluencers.map(ci => ({
      id: `ci_${ci.campaign_id}_${ci.influencer_id}`,
      influencer_id: ci.influencer_id,
      influencer_name: ci.influencer_name,
      influencer_username: ci.influencer_username,
      influencer_phone: ci.influencer_phone,
      campaign_id: ci.campaign_id,
      campaign_name: ci.campaign_name,
      brand_name: ci.brand_name,
      status: ci.status,
      payment_amount: ci.payment_amount,
      deliverables: ci.deliverables,
      mode: "campaign" as const
    }));

    // All influencers as direct outreach items
    const directItems = allInfluencers.map(inf => ({
      id: `direct_${inf.id}`,
      influencer_id: inf.id,
      influencer_name: inf.full_name,
      influencer_username: inf.username,
      influencer_phone: inf.phone,
      campaign_id: null,
      campaign_name: "Direct Outreach",
      brand_name: "—",
      status: "Assigned",
      payment_amount: inf.reel_price || 0,
      deliverables: "1 Reel",
      mode: "direct" as const
    }));

    // If campaign filter is "all", show campaign items first + all direct items
    // If a campaign is selected, only show items for that campaign
    if (selectedCampaignId !== "all") {
      return ciItems.filter(i => i.campaign_id === selectedCampaignId);
    }

    // Merge: show campaign items + direct items (avoid duplicates by influencer_id)
    const campaignInfluencerIds = new Set(ciItems.map(i => i.influencer_id));
    const nonAssignedDirect = directItems.filter(d => !campaignInfluencerIds.has(d.influencer_id));

    return [...ciItems, ...nonAssignedDirect];
  };

  const outreachList = buildOutreachList();

  const filteredList = outreachList.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.influencer_name.toLowerCase().includes(q) ||
      item.influencer_username.toLowerCase().includes(q) ||
      item.campaign_name.toLowerCase().includes(q)
    );
  });

  const selectedItem = filteredList.find(i => i.id === selectedId) || filteredList[0] || null;

  const templates = [
    {
      id: "pitch",
      name: "First Outreach / Pitch",
      body: "Hi {Creator Name},\n\nLove your content on Instagram! This is {Sender Name} from The Scene Co. \n\nWe have an exciting collaboration opportunity for {Brand Name} and would love to work with you for {Deliverables}.\n\nLet me know if you're interested and we can discuss the details! \n\nBest,\n{Sender Name}"
    },
    {
      id: "followup",
      name: "Follow-up Reminder",
      body: "Hey {Creator Name},\n\nJust following up on our collab invite for {Brand Name}! We're finalizing our roster this week and would love to have you on board. \n\nLet me know if you'd be interested! \n\nBest,\n{Sender Name}"
    },
    {
      id: "barter",
      name: "Barter Campaign Offer",
      body: "Hi {Creator Name},\n\nHope you're doing well! We have a special gifting barter campaign for {Brand Name} where we ship you their latest collection in exchange for {Deliverables}.\n\nIf you love the brand and want to collab, share your shipping address and contact number!\n\nCheers,\n{Sender Name}"
    },
    {
      id: "brief",
      name: "Campaign Brief & Deliverables",
      body: "Hey {Creator Name},\n\nThrilled to have you on board for {Brand Name} - '{Campaign Name}'!\n\nDeliverables for this run:\n- {Deliverables}\n- Payout: {Payout Budget}\n\nPlease share a draft/preview with us for approval before going live. Let's make this amazing!\n\nBest,\n{Sender Name}"
    },
    {
      id: "invoice",
      name: "Invoice & Payment Request",
      body: "Hi {Creator Name},\n\nAwesome job on the deliverables for the {Brand Name} campaign!\n\nPlease share your bank details and invoice for {Payout Budget} so we can process your payout.\n\nThank you for working with us!\n\nBest,\n{Sender Name}"
    }
  ];

  useEffect(() => {
    if (!selectedItem) { setMessageText(""); return; }
    const tpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
    let body = tpl.body;
    body = body.replace(/{Creator Name}/g, selectedItem.influencer_name);
    body = body.replace(/{Sender Name}/g, currentUser?.name || "The Scene Co.");
    body = body.replace(/{Brand Name}/g, selectedItem.brand_name || "our client");
    body = body.replace(/{Campaign Name}/g, selectedItem.campaign_name || "our campaign");
    body = body.replace(/{Deliverables}/g, selectedItem.deliverables || "1 Instagram Reel");
    body = body.replace(/{Payout Budget}/g, formatCurrency(selectedItem.payment_amount));
    setMessageText(body);
  }, [selectedItem?.id, selectedTemplateId, currentUser]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedItem || !selectedItem.campaign_id) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: selectedItem.campaign_id, influencer_id: selectedItem.influencer_id, status: newStatus })
      });
      if (res.ok) {
        pushToast({ type: "success", title: "Status Updated", message: `${selectedItem.influencer_name} → ${newStatus}` });
        loadData();
      }
    } catch {
      pushToast({ type: "error", title: "Update Failed", message: "Could not update outreach status." });
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    pushToast({ type: "info", title: "Copied", message: "Message copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerWhatsApp = (mode: "web" | "api") => {
    if (!selectedItem) return;
    const phone = selectedItem.influencer_phone?.replace(/[^0-9]/g, "");
    if (!phone) {
      pushToast({ type: "error", title: "No Phone Number", message: `${selectedItem.influencer_name} has no phone number on file. Add it via Edit Profile.` });
      return;
    }

    const encoded = encodeURIComponent(messageText);
    const url = mode === "web"
      ? `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, "_blank");

    // Auto-log activity
    logActivity();
  };

  const logActivity = async () => {
    if (!selectedItem) return;
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_id: selectedItem.influencer_id,
          campaign_id: selectedItem.campaign_id,
          type: "whatsapp",
          content: `WhatsApp outreach sent via "${templates.find(t => t.id === selectedTemplateId)?.name}". Preview: ${messageText.substring(0, 120)}...`
        })
      });
      // Auto-advance campaign status
      if (selectedItem.mode === "campaign" && selectedItem.status === "Assigned") {
        await handleUpdateStatus("Contacted");
      }
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  };

  const getStatusBadge = (status: string, mode: string) => {
    if (mode === "direct") return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    switch (status) {
      case "Assigned": return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
      case "Contacted": return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
      case "Negotiating": return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "Approved": return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "Declined": return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      default: return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
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
              Select any creator, generate a personalised message, and send via WhatsApp in one click.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-secondary/50 border border-border rounded-xl px-3 py-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <span><strong className="text-foreground">{allInfluencers.length}</strong> creators available</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">
            {/* Left Panel: Creator List */}
            <div className="lg:col-span-4 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              <div className="p-4 border-b border-border space-y-3 shrink-0">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Filter by Campaign
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCampaignId}
                      onChange={e => { setSelectedCampaignId(e.target.value); setSelectedId(null); }}
                      className="w-full appearance-none bg-background border border-border text-xs font-semibold rounded-xl px-3 py-2 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"
                    >
                      <option value="all">All Creators (Campaign + Direct)</option>
                      {campaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setSelectedId(null); }}
                    placeholder="Search by creator name..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none placeholder-zinc-500 text-foreground focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60 scrollbar-none">
                {filteredList.length > 0 ? (
                  filteredList.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left p-3.5 transition-all hover:bg-secondary/40 flex items-center justify-between border-l-2 cursor-pointer ${
                        selectedItem?.id === item.id
                          ? "bg-secondary/60 border-l-indigo-500"
                          : "border-l-transparent text-zinc-500"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {item.influencer_name}
                        </h4>
                        <span className="text-[10px] text-zinc-500 block truncate font-medium">
                          @{item.influencer_username}
                          {item.mode === "campaign" && (
                            <span className="ml-1 text-indigo-400">• {item.campaign_name}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusBadge(item.status, item.mode)}`}>
                          {item.mode === "campaign" ? item.status : "Direct"}
                        </span>
                        {item.influencer_phone ? (
                          <span className="text-[9px] text-emerald-500 font-semibold">📞 Ready</span>
                        ) : (
                          <span className="text-[9px] text-zinc-400 font-semibold">No phone</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-20 space-y-2">
                    <Users className="h-8 w-8 text-zinc-300 mx-auto" />
                    <p className="text-xs text-zinc-500 font-semibold">No creators found</p>
                    <p className="text-[10px] text-zinc-400 px-4">Add influencers to the database to start outreach.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Panel: Message Editor */}
            <div className="lg:col-span-5 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              {selectedItem ? (
                <div className="p-5 flex flex-col h-full overflow-y-auto scrollbar-none">
                  {/* Creator header */}
                  <div className="pb-4 border-b border-border/80 shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                          {selectedItem.mode === "campaign" ? `${selectedItem.brand_name} Campaign` : "Direct Outreach"}
                        </span>
                        <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-0.5">
                          {selectedItem.influencer_name}
                        </h2>
                        <a
                          href={`https://instagram.com/${selectedItem.influencer_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-zinc-500 hover:text-indigo-500 font-semibold flex items-center gap-1 mt-0.5"
                        >
                          @{selectedItem.influencer_username}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-zinc-400 block font-bold uppercase">
                          {selectedItem.mode === "campaign" ? "Outreach Status" : "Mode"}
                        </span>
                        {selectedItem.mode === "campaign" && currentUser?.role !== "viewer" ? (
                          <select
                            value={selectedItem.status}
                            disabled={updating}
                            onChange={e => handleUpdateStatus(e.target.value)}
                            className="bg-background border border-border text-[10px] font-bold rounded-lg px-2 py-1 text-zinc-600 dark:text-zinc-300 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="Assigned">Not Contacted</option>
                            <option value="Contacted">Outreach Sent</option>
                            <option value="Negotiating">Negotiating</option>
                            <option value="Approved">Approved</option>
                            <option value="Declined">Declined</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusBadge(selectedItem.status, selectedItem.mode)}`}>
                            {selectedItem.mode === "campaign" ? selectedItem.status : "Direct"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Campaign context */}
                    <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-secondary/30 rounded-xl border border-border/40">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-bold uppercase">Deliverables</span>
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-1">
                          {selectedItem.deliverables || "1 Instagram Reel"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-bold uppercase">Compensation</span>
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(selectedItem.payment_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message editor */}
                  <div className="flex-1 flex flex-col pt-4 min-h-[250px]">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Message Draft</span>
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
                      className="w-full flex-1 bg-background border border-border rounded-xl p-3.5 text-xs text-foreground focus:outline-none resize-none font-mono leading-relaxed min-h-[180px]"
                    />

                    {!selectedItem.influencer_phone && (
                      <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          No phone number on file for this creator. Add it via{" "}
                          <a href="/influencers" className="underline font-bold">Edit Profile</a>
                          {" "}to enable WhatsApp sending. You can still copy and send manually.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={handleCopyText}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 border border-border hover:bg-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        <Copy className="h-4 w-4 text-zinc-400" />
                        Copy Message
                      </button>
                      {selectedItem.influencer_phone ? (
                        <button
                          onClick={() => triggerWhatsApp("web")}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          Open WhatsApp Web
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerWhatsApp("api")}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-400 text-xs font-semibold rounded-xl cursor-not-allowed"
                          disabled
                        >
                          <Smartphone className="h-4 w-4" />
                          No Phone Saved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-zinc-500 space-y-3">
                  <MessageSquare className="h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No Creator Selected</p>
                  <p className="text-[11px] text-zinc-400 max-w-[220px]">
                    Pick a creator from the left panel to compose and send a WhatsApp message.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel: Templates */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-h-[68vh]">
              <div className="p-4 border-b border-border shrink-0">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
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
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-none">
                <div>
                  <h4 className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Best Practices</h4>
                  <ul className="space-y-2.5 text-[11px] text-zinc-500 font-medium">
                    {[
                      "Always introduce the agency (The Scene Co.) and name-drop the brand early.",
                      "Specify the exact deliverable format (Reels, Story, Carousel) to avoid scope creep.",
                      "Keep the message friendly, professional, and within 2–3 paragraphs.",
                      "Always personalise before sending — edit the draft if needed."
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-secondary/35 border border-border rounded-xl">
                  <div className="flex gap-2 text-[10px] text-zinc-500 leading-normal">
                    <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      After clicking "Open WhatsApp Web", the outreach is automatically logged in the creator's CRM activity timeline.
                    </span>
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
