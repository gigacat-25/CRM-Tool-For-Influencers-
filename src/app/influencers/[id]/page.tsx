"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Globe,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  FileText,
  Activity,
  Plus,
  Loader2,
  Sparkles,
  MapPin,
  TrendingUp,
  Award,
  BookOpen
} from "lucide-react";
import { Instagram, Youtube, Linkedin, Twitter } from "@/components/social-icons";
import { useNotifications } from "@/components/notification-provider";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InfluencerDetailPage({ params }: PageProps) {
  const { id } = use(params); // Unwrap params promise with React 19 use()
  const router = useRouter();
  const { pushToast } = useNotifications();

  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [influencer, setInfluencer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Note/Activity inputs
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  
  const [activityType, setActivityType] = useState<"call" | "email" | "whatsapp" | "meeting" | "follow_up">("whatsapp");
  const [activityContent, setActivityContent] = useState("");
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  // Active logs tab: 'activity' or 'notes'
  const [activeTimelineTab, setActiveTimelineTab] = useState<"activity" | "notes">("activity");

  const loadInfluencerData = async () => {
    try {
      // Load current user
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }

      const res = await fetch(`/api/influencers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInfluencer(data.influencer);
      } else {
        pushToast({
          type: "error",
          title: "Profile Not Found",
          message: "The requested influencer does not exist."
        });
        router.push("/influencers");
      }
    } catch (err) {
      console.error("Failed to load detailed profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfluencerData();
  }, [id]);

  // Log Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencer_id: id, content: noteContent })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Note Added",
          message: "Saved note to influencer profile."
        });
        setNoteContent("");
        loadInfluencerData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to save note."
      });
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Log Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityContent.trim()) return;

    setActivitySubmitting(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_id: id,
          type: activityType,
          content: activityContent
        })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "Timeline Updated",
          message: `Logged ${activityType} interaction.`
        });
        setActivityContent("");
        loadInfluencerData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to log interaction."
      });
    } finally {
      setActivitySubmitting(false);
    }
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

  if (!influencer) return null;

  // Format helper for numbers
  const formatNum = (num: number) => {
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

  // Safe parsing for lists
  const parseJsonList = (jsonStr: string) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : [];
    } catch {
      return [];
    }
  };

  const topCities = parseJsonList(influencer.top_cities);
  const topStates = parseJsonList(influencer.top_states);
  const topCountries = parseJsonList(influencer.top_countries);
  const collabPrefs = parseJsonList(influencer.collab_preferences);
  const secLanguages = parseJsonList(influencer.secondary_langs);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Navigation Back */}
        <button
          onClick={() => router.push("/influencers")}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Influencer CRM
        </button>

        {/* Profile Card Header */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={influencer.profile_photo}
              alt={influencer.full_name}
              className="h-16 w-16 rounded-full object-cover border-2 border-border shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{influencer.full_name}</h1>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  {influencer.tier}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  influencer.availability_status === "Available"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}>
                  {influencer.availability_status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">@{influencer.username}</p>
              
              {/* Location pin */}
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase mt-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{influencer.city}, {influencer.state}, {influencer.country}</span>
              </div>
            </div>
          </div>

          {/* AI Grade Card Badge */}
          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-border rounded-xl w-fit shrink-0">
            <Award className="h-8 w-8 text-indigo-500" />
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">AI Overall Rank</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {influencer.overall_grade}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">({influencer.overall_score}/100)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Columns Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Main Panels (AI Scores, Demographics, Timeline) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Scores Breakdown Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-bold text-sm">AI Influencer Metrics Scoring</h3>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Reach Score", score: influencer.reach_score, desc: "Based on followers count and audience scale." },
                  { name: "Engagement Score", score: influencer.engagement_score, desc: "Based on average likes, comments and shares." },
                  { name: "Content Quality Score", score: influencer.content_quality_score, desc: "Visual aesthetics, tone, and production rating." },
                  { name: "Communication Score", score: influencer.communication_score, desc: "Response speed, alignment, and onboarding feedback." },
                  { name: "Campaign Performance Score", score: influencer.campaign_performance_score, desc: "Reliability, brand fit, and campaign goals met." }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{item.name}</span>
                      <span className="font-bold text-indigo-500">{item.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demographics Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
              <h3 className="font-bold text-sm">Audience Demographics</h3>

              {/* Gender ratio progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-pink-500 flex items-center gap-1">Female: {influencer.female_audience_pct}%</span>
                  <span className="text-blue-500 flex items-center gap-1">Male: {influencer.male_audience_pct}%</span>
                </div>
                <div className="h-3 w-full bg-blue-500 rounded-full overflow-hidden flex">
                  <div className="h-full bg-pink-500" style={{ width: `${influencer.female_audience_pct}%` }} />
                </div>
              </div>

              {/* Age groups distribution list */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Age Distribution</h4>
                {[
                  { range: "13-17", pct: influencer.age_13_17_pct },
                  { range: "18-24", pct: influencer.age_18_24_pct },
                  { range: "25-34", pct: influencer.age_25_34_pct },
                  { range: "35-44", pct: influencer.age_35_44_pct },
                  { range: "45+", pct: influencer.age_45_plus_pct }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs font-semibold">
                    <span className="w-10 text-zinc-500">{item.range}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-zinc-700 dark:text-zinc-300">{item.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Top Cities, States, Countries */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/60 text-[11px]">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider mb-1.5">Top Cities</span>
                  <ul className="space-y-1 font-semibold">
                    {topCities.map((c: string, i: number) => (
                      <li key={i} className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-400">{i+1}.</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider mb-1.5">Top States</span>
                  <ul className="space-y-1 font-semibold">
                    {topStates.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-400">{i+1}.</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider mb-1.5">Top Countries</span>
                  <ul className="space-y-1 font-semibold">
                    {topCountries.map((co: string, i: number) => (
                      <li key={i} className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-400">{i+1}.</span> {co}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Interaction Logs Timeline */}
            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
              {/* Tabs header */}
              <div className="flex border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10 px-4">
                <button
                  onClick={() => setActiveTimelineTab("activity")}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold border-b-2 cursor-pointer ${
                    activeTimelineTab === "activity"
                      ? "border-primary text-primary"
                      : "border-transparent text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Interaction Logs ({influencer.activities.length})
                </button>
                <button
                  onClick={() => setActiveTimelineTab("notes")}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold border-b-2 cursor-pointer ${
                    activeTimelineTab === "notes"
                      ? "border-primary text-primary"
                      : "border-transparent text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Internal Notes ({influencer.notes.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 flex-1 space-y-4">
                {activeTimelineTab === "activity" ? (
                  <>
                    {/* Log Activity Form */}
                    {currentUser?.role !== "viewer" && (
                      <form onSubmit={handleAddActivity} className="flex flex-col sm:flex-row gap-2 border-b border-border/60 pb-4">
                        <select
                          value={activityType}
                          onChange={e => setActivityType(e.target.value as any)}
                          className="bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 w-full sm:w-32 self-start"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="call">Call Log</option>
                          <option value="email">Email Sent</option>
                          <option value="meeting">Meeting</option>
                          <option value="follow_up">Follow Up</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={activityContent}
                          onChange={e => setActivityContent(e.target.value)}
                          placeholder="e.g. Sent rate card negotiation proposal. Awaiting response..."
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={activitySubmitting}
                          className="py-1.5 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-95 shadow-sm shrink-0 flex items-center gap-1 cursor-pointer justify-center"
                        >
                          {activitySubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          Log
                        </button>
                      </form>
                    )}

                    {/* Activity Feed list */}
                    <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto">
                      {influencer.activities.length > 0 ? (
                        influencer.activities.map((act: any) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs leading-normal">
                            <span className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide shrink-0 ${
                              act.type === "whatsapp"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : act.type === "email"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-indigo-500/10 text-indigo-500"
                            }`}>
                              {act.type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-700 dark:text-zinc-300">
                                <span className="font-bold text-foreground">{act.user_name}</span>{" "}
                                {act.content}
                              </p>
                              <span className="text-[9px] text-zinc-400 block mt-0.5">
                                {new Date(act.created_at).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-400 font-semibold">
                          No communication interactions logged yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Add Note Form */}
                    {currentUser?.role !== "viewer" && (
                      <form onSubmit={handleAddNote} className="flex gap-2 border-b border-border/60 pb-4">
                        <input
                          type="text"
                          required
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          placeholder="Log an internal notes about this creator (strengths, brand safety)..."
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={noteSubmitting}
                          className="py-1.5 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-95 shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          {noteSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          Add Note
                        </button>
                      </form>
                    )}

                    {/* Notes List */}
                    <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto">
                      {influencer.notes.length > 0 ? (
                        influencer.notes.map((note: any) => (
                          <div key={note.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-border rounded-xl text-xs space-y-1">
                            <p className="text-zinc-700 dark:text-zinc-300 font-medium">{note.content}</p>
                            <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold">
                              <span>By: {note.user_name}</span>
                              <span>{new Date(note.created_at).toLocaleDateString("en-IN")}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-400 font-semibold">
                          No internal notes logged yet.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Right Column Panels (Pricing, Demographics, Bio) */}
          <div className="space-y-6">
            
            {/* Pricing Grid Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                <h3 className="font-bold text-sm">Pricing Card</h3>
              </div>
              <div className="divide-y divide-border/60 text-xs font-semibold">
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">Instagram Reel Rate</span>
                  <span className="font-bold">{influencer.reel_price ? formatCurrency(influencer.reel_price) : "Barter"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">Instagram Story Rate</span>
                  <span className="font-bold">{influencer.story_price ? formatCurrency(influencer.story_price) : "Barter"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">Static Post Rate</span>
                  <span className="font-bold">{influencer.static_post_price ? formatCurrency(influencer.static_post_price) : "Barter"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">Carousel Rate</span>
                  <span className="font-bold">{influencer.carousel_price ? formatCurrency(influencer.carousel_price) : "Barter"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">YouTube Video Rate</span>
                  <span className="font-bold">{influencer.youtube_integration_price ? formatCurrency(influencer.youtube_integration_price) : "N/A"}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-400">UGC Video Price</span>
                  <span className="font-bold">{influencer.ugc_video_price ? formatCurrency(influencer.ugc_video_price) : "Barter"}</span>
                </div>
              </div>
            </div>

            {/* Social profiles & Basic Info */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm">Basic Info & Channels</h3>
              
              {/* Social links */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {influencer.instagram_handle && (
                  <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border border-border rounded-xl hover:bg-secondary">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span>Instagram</span>
                  </a>
                )}
                {influencer.youtube_handle && (
                  <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border border-border rounded-xl hover:bg-secondary">
                    <Youtube className="h-4 w-4 text-rose-500" />
                    <span>YouTube</span>
                  </a>
                )}
                {influencer.linkedin_handle && (
                  <a href={influencer.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border border-border rounded-xl hover:bg-secondary">
                    <Linkedin className="h-4 w-4 text-blue-500" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {influencer.twitter_handle && (
                  <a href={influencer.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border border-border rounded-xl hover:bg-secondary">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    <span>X/Twitter</span>
                  </a>
                )}
              </div>

              {/* Bio & specs */}
              <div className="text-xs space-y-3 pt-3 border-t border-border/60">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Bio</span>
                  <p className="text-zinc-600 dark:text-zinc-400 font-semibold mt-1">{influencer.bio || "No biography provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-semibold">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Email</span>
                    <span className="text-zinc-700 dark:text-zinc-300 block truncate">{influencer.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Phone</span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">{influencer.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Primary Language</span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">{influencer.primary_lang}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Sec. Languages</span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">{secLanguages.join(", ") || "None"}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider mb-1.5">Collaboration Preferences</span>
                  <div className="flex flex-wrap gap-1.5">
                    {collabPrefs.map((pref: string) => (
                      <span key={pref} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-500/5 border border-indigo-500/10 text-indigo-500">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-bold text-sm">Contracts & Assets</h3>
              </div>
              <div className="space-y-2.5">
                {influencer.documents.length > 0 ? (
                  influencer.documents.map((doc: any) => (
                    <button
                      key={doc.id}
                      onClick={() => pushToast({ type: "info", title: "Asset Download", message: `Downloading mock asset: ${doc.name}` })}
                      className="flex items-center gap-3 w-full p-2 border border-border hover:bg-secondary rounded-xl text-left text-xs font-semibold cursor-pointer"
                    >
                      <FileText className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-bold text-zinc-900 dark:text-zinc-200">{doc.name}</span>
                        <span className="text-[9px] text-zinc-500 uppercase block mt-0.5">{doc.doc_type}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-zinc-500 text-xs">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
