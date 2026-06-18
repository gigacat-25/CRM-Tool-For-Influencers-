"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  MapPin,
  Settings,
  HelpCircle,
  Sparkles,
  ArrowLeftRight,
  UserCheck,
  Check
} from "lucide-react";
import { Instagram, Youtube, Linkedin, Twitter } from "@/components/social-icons";
import { useNotifications } from "@/components/notification-provider";

// Helper for formatting
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

export default function InfluencersPage() {
  const router = useRouter();
  const { pushToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lists & Tabs
  const [activeListId, setActiveListId] = useState<string>("all");
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [isAiSearch, setIsAiSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [minER, setMinER] = useState("");
  const [maxReelRate, setMaxReelRate] = useState("");

  // Selection & Compare
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Add/Edit Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInfluencerId, setEditInfluencerId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState("basic");

  // Form State
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formFollowers, setFormFollowers] = useState("0");
  const [formER, setFormER] = useState("0.0");
  const [formInstagram, setFormInstagram] = useState("");
  const [formYoutube, setFormYoutube] = useState("");
  const [formReelRate, setFormReelRate] = useState("0");
  const [formStoryRate, setFormStoryRate] = useState("0");
  const [formAvailability, setFormAvailability] = useState("Available");
  const [formQuality, setFormQuality] = useState("5");
  const [formCommunication, setFormCommunication] = useState("5");
  const [formNotes, setFormNotes] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formLanguages, setFormLanguages] = useState<string[]>([]);

  // Unique lists from data
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load current user for role check
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }

      // Load influencers with current active shortlist filter
      const listQuery = activeListId !== "all" ? `&listId=${activeListId}` : "";
      const url = `/api/influencers?q=${encodeURIComponent(searchTerm)}&category=${selectedCategory}&city=${selectedCity}&tier=${selectedTier}&status=${selectedStatus}&minFollowers=${minFollowers}&maxFollowers=${maxFollowers}&minER=${minER}&maxReelRate=${maxReelRate}${listQuery}`;
      
      const infRes = await fetch(url);
      if (infRes.ok) {
        const infJson = await infRes.json();
        setInfluencers(infJson.influencers);

        // Extract unique cities & categories for filters on initial load
        if (selectedCity === "" && selectedCategory === "") {
          const cities = new Set<string>();
          const cats = new Set<string>();
          infJson.influencers.forEach((inf: any) => {
            if (inf.city) cities.add(inf.city);
            if (inf.categories) {
              inf.categories.forEach((c: string) => cats.add(c));
            }
          });
          setUniqueCities(Array.from(cities));
          setUniqueCategories(Array.from(cats));
        }
      }

      // Load shortlists
      const listsRes = await fetch("/api/lists");
      if (listsRes.ok) {
        const listsJson = await listsRes.json();
        setLists(listsJson.lists);
      }
    } catch (err) {
      console.error("Failed to load influencer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeListId, selectedCategory, selectedCity, selectedTier, selectedStatus, minFollowers, maxFollowers, minER, maxReelRate]);

  // Handle URL query parameters for AI Search on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const ai = params.get("ai");
      
      if (q) {
        setSearchTerm(q);
        if (ai === "true") {
          setIsAiSearch(true);
          const query = q.toLowerCase();
          
          // 1. Parse Category
          const categoryKeywords = {
            fashion: "Fashion",
            beauty: "Beauty",
            fitness: "Fitness",
            gym: "Fitness",
            food: "Food",
            cooking: "Food",
            recipe: "Food",
            travel: "Travel",
            tech: "Tech",
            technology: "Tech",
            gadget: "Tech",
            gaming: "Gaming",
            lifestyle: "Lifestyle",
            luxury: "Luxury",
            ugc: "UGC Creator"
          };
          let matchedCat = "";
          Object.entries(categoryKeywords).forEach(([key, val]) => {
            if (query.includes(key)) matchedCat = val;
          });

          // 2. Parse City
          let matchedCity = "";
          if (query.includes("bangalore") || query.includes("bengaluru")) matchedCity = "Bangalore";
          else if (query.includes("mumbai") || query.includes("bombay")) matchedCity = "Mumbai";
          else if (query.includes("delhi")) matchedCity = "Delhi";
          else if (query.includes("kolkata")) matchedCity = "Kolkata";
          else if (query.includes("pune")) matchedCity = "Pune";

          // 3. Parse Followers Range
          let minF = "";
          let maxF = "";
          if (query.includes("50k") && query.includes("500k")) {
            minF = "50000";
            maxF = "500000";
          } else if (query.includes("10k") && query.includes("100k")) {
            minF = "10000";
            maxF = "100000";
          } else if (query.includes("1m") || query.includes("1 million")) {
            minF = "1000000";
          } else if (query.includes("micro")) {
            minF = "10000";
            maxF = "100000";
          } else if (query.includes("mid")) {
            minF = "100000";
            maxF = "500000";
          }

          // 4. Parse Engagement Rate
          let parsedER = "";
          const erMatch = query.match(/(\d+(?:\.\d+)?)\s*%/);
          if (erMatch) {
            parsedER = erMatch[1];
          } else if (query.includes("engagement above 4")) {
            parsedER = "4.0";
          } else if (query.includes("engagement above 5")) {
            parsedER = "5.0";
          }

          if (matchedCat) setSelectedCategory(matchedCat);
          if (matchedCity) setSelectedCity(matchedCity);
          if (minF) setMinFollowers(minF);
          if (maxF) setMaxFollowers(maxF);
          if (parsedER) setMinER(parsedER);
          
          pushToast({
            type: "success",
            title: "AI Search Triggered",
            message: `Initiating parse for query: "${q}"`
          });
        }
      }
    }
  }, []);


  // Run Standard Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // AI Natural Language Parser Trigger
  const handleAiSearchToggle = () => {
    if (!isAiSearch) {
      setIsAiSearch(true);
    } else {
      setIsAiSearch(false);
      setSearchTerm("");
      // Reset parsed filters
      setSelectedCity("");
      setSelectedTier("");
      setMinFollowers("");
      setMaxFollowers("");
      setMinER("");
      loadData();
    }
  };

  // Simple client-side NLP match
  const executeAiSearch = () => {
    if (!searchTerm) return;
    const query = searchTerm.toLowerCase();

    // 1. Parse Category
    const categoryKeywords = {
      fashion: "Fashion",
      beauty: "Beauty",
      fitness: "Fitness",
      gym: "Fitness",
      food: "Food",
      cooking: "Food",
      recipe: "Food",
      travel: "Travel",
      tech: "Tech",
      technology: "Tech",
      gadget: "Tech",
      gaming: "Gaming",
      lifestyle: "Lifestyle",
      luxury: "Luxury",
      ugc: "UGC Creator"
    };

    let matchedCat = "";
    Object.entries(categoryKeywords).forEach(([key, val]) => {
      if (query.includes(key)) matchedCat = val;
    });

    // 2. Parse City
    let matchedCity = "";
    if (query.includes("bangalore") || query.includes("bengaluru")) matchedCity = "Bangalore";
    else if (query.includes("mumbai") || query.includes("bombay")) matchedCity = "Mumbai";
    else if (query.includes("delhi")) matchedCity = "Delhi";
    else if (query.includes("kolkata")) matchedCity = "Kolkata";
    else if (query.includes("pune")) matchedCity = "Pune";

    // 3. Parse Followers Range
    let minF = "";
    let maxF = "";
    if (query.includes("50k") && query.includes("500k")) {
      minF = "50000";
      maxF = "500000";
    } else if (query.includes("10k") && query.includes("100k")) {
      minF = "10000";
      maxF = "100000";
    } else if (query.includes("1m") || query.includes("1 million")) {
      minF = "1000000";
    } else if (query.includes("micro")) {
      minF = "10000";
      maxF = "100000";
    } else if (query.includes("mid")) {
      minF = "100000";
      maxF = "500000";
    }

    // 4. Parse Engagement Rate
    let parsedER = "";
    const erMatch = query.match(/(\d+(?:\.\d+)?)\s*%/);
    if (erMatch) {
      parsedER = erMatch[1];
    } else if (query.includes("engagement above 4")) {
      parsedER = "4.0";
    } else if (query.includes("engagement above 5")) {
      parsedER = "5.0";
    }

    // Apply parsed filters to state
    if (matchedCat) setSelectedCategory(matchedCat);
    if (matchedCity) setSelectedCity(matchedCity);
    if (minF) setMinFollowers(minF);
    if (maxF) setMaxFollowers(maxF);
    if (parsedER) setMinER(parsedER);

    pushToast({
      type: "success",
      title: "AI Filter Applied",
      message: `Parsed: ${matchedCat ? "Category: " + matchedCat : ""} ${matchedCity ? "City: " + matchedCity : ""} ${minF ? "Followers: " + formatNumber(Number(minF)) + "+" : ""} ${parsedER ? "ER: >=" + parsedER + "%" : ""}`
    });

    loadData();
  };

  // Checkbox toggle
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === influencers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(influencers.map(inf => inf.id));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (influencers.length === 0) return;
    
    // Header
    const headers = ["ID", "Full Name", "Username", "Email", "Phone", "City", "Followers", "Engagement Rate", "Tier", "Reel Price", "Story Price", "Grade", "Status"];
    
    // Rows
    const rows = influencers.map(inf => [
      inf.id,
      inf.full_name,
      inf.username,
      inf.email || "",
      inf.phone || "",
      inf.city || "",
      inf.followers,
      inf.engagement_rate,
      inf.tier,
      inf.reel_price,
      inf.story_price,
      inf.overall_grade,
      inf.availability_status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    // Download trigger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SceneCo_Influencers_${activeListId}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    pushToast({
      type: "success",
      title: "Export Successful",
      message: `Downloaded ${influencers.length} influencer profiles to CSV.`
    });
  };

  // CSV Import Parser
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      
      // Assume header: Full Name,Username,Email,Phone,City,Followers,Engagement Rate,Reel Price,Story Price,Categories
      const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const bodyRows = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;

      for (const row of bodyRows) {
        const columns = row.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        if (columns.length < 2) continue;

        const rowData: any = {};
        header.forEach((h, idx) => {
          rowData[h] = columns[idx] || "";
        });

        // Map fields
        const payload = {
          full_name: rowData["Full Name"] || rowData["name"] || "Imported Creator",
          username: rowData["Username"] || rowData["username"] || "imported_" + Math.random().toString(36).substring(2, 6),
          email: rowData["Email"] || rowData["email"] || "",
          phone: rowData["Phone"] || rowData["phone"] || "",
          city: rowData["City"] || rowData["city"] || "Bangalore",
          followers: parseInt(rowData["Followers"] || rowData["followers"] || "5000", 10),
          engagement_rate: parseFloat(rowData["Engagement Rate"] || rowData["engagement_rate"] || "3.5"),
          reel_price: parseInt(rowData["Reel Price"] || rowData["reel_price"] || "0", 10),
          story_price: parseInt(rowData["Story Price"] || rowData["story_price"] || "0", 10),
          categories: (rowData["Categories"] || rowData["categories"] || "Lifestyle").split(";").map((c: string) => c.trim()),
          languages: ["English"]
        };

        try {
          const res = await fetch("/api/influencers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      pushToast({
        type: successCount > 0 ? "success" : "error",
        title: "CSV Import Processed",
        message: `Successfully imported ${successCount} profiles. Errors: ${errorCount}.`
      });
      loadData();
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Create shortlist List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName) return;

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName, description: newListDesc })
      });

      if (res.ok) {
        pushToast({
          type: "success",
          title: "List Created",
          message: `shortlist "${newListName}" created successfully.`
        });
        setNewListName("");
        setNewListDesc("");
        setShowCreateListModal(false);
        loadData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to create shortlist."
      });
    }
  };

  // Delete Shortlist
  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete the shortlist "${listName}"?`)) return;

    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      if (res.ok) {
        pushToast({
          type: "info",
          title: "List Deleted",
          message: `shortlist "${listName}" has been deleted.`
        });
        setActiveListId("all");
        loadData();
      }
    } catch {
      pushToast({
        type: "error",
        title: "Error",
        message: "Failed to delete list."
      });
    }
  };

  // Submit Add/Edit Influencer
  const handleInfluencerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername) {
      pushToast({
        type: "error",
        title: "Validation Error",
        message: "Full name and username are required."
      });
      return;
    }

    const payload = {
      full_name: formName,
      username: formUsername,
      email: formEmail,
      phone: formPhone,
      city: formCity,
      bio: formBio,
      followers: parseInt(formFollowers, 10) || 0,
      engagement_rate: parseFloat(formER) || 0.0,
      instagram_handle: formInstagram || formUsername,
      instagram_url: `https://instagram.com/${formInstagram || formUsername}`,
      youtube_handle: formYoutube || null,
      youtube_url: formYoutube ? `https://youtube.com/c/${formYoutube}` : null,
      reel_price: parseInt(formReelRate, 10) || 0,
      story_price: parseInt(formStoryRate, 10) || 0,
      availability_status: formAvailability,
      content_quality_rating: parseInt(formQuality, 10) || 5,
      communication_rating: parseInt(formCommunication, 10) || 5,
      notes: formNotes,
      categories: formCategories,
      languages: formLanguages.length > 0 ? formLanguages : ["English"]
    };

    try {
      let res;
      if (isEditMode && editInfluencerId) {
        res = await fetch(`/api/influencers/${editInfluencerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/influencers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        pushToast({
          type: "success",
          title: isEditMode ? "Profile Updated" : "Influencer Added",
          message: isEditMode
            ? `Successfully updated ${formName}'s profile.`
            : `Successfully added ${formName} to database.`
        });
        resetForm();
        setShowAddModal(false);
        loadData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Save operation failed.");
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Save Failed",
        message: err.message || "Failed to save influencer profile."
      });
    }
  };

  const handleEditClick = (inf: any) => {
    setIsEditMode(true);
    setEditInfluencerId(inf.id);
    setFormName(inf.full_name);
    setFormUsername(inf.username);
    setFormEmail(inf.email || "");
    setFormPhone(inf.phone || "");
    setFormCity(inf.city || "");
    setFormBio(inf.bio || "");
    setFormFollowers(String(inf.followers || 0));
    setFormER(String(inf.engagement_rate || 0.0));
    setFormInstagram(inf.instagram_handle || "");
    setFormYoutube(inf.youtube_handle || "");
    setFormReelRate(String(inf.reel_price || 0));
    setFormStoryRate(String(inf.story_price || 0));
    setFormAvailability(inf.availability_status || "Available");
    setFormQuality(String(inf.content_quality_rating || 5));
    setFormCommunication(String(inf.communication_rating || 5));
    setFormNotes(inf.notes || "");
    setFormCategories(inf.categories || []);
    setFormLanguages(inf.languages || []);
    
    setActiveFormTab("basic");
    setShowAddModal(true);
  };

  const handleDeleteInfluencer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the profile of "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/influencers/${id}`, { method: "DELETE" });
      if (res.ok) {
        pushToast({
          type: "info",
          title: "Profile Deleted",
          message: `Influencer "${name}" deleted from platform.`
        });
        loadData();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Deletion Blocked",
        message: err.message || "Deletions require Super Admin permissions."
      });
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditInfluencerId(null);
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormCity("");
    setFormBio("");
    setFormFollowers("0");
    setFormER("0.0");
    setFormInstagram("");
    setFormYoutube("");
    setFormReelRate("0");
    setFormStoryRate("0");
    setFormAvailability("Available");
    setFormQuality("5");
    setFormCommunication("5");
    setFormNotes("");
    setFormCategories([]);
    setFormLanguages([]);
  };

  const toggleFormCategory = (cat: string) => {
    setFormCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categoriesOptions = [
    "Fashion", "Beauty", "Fitness", "Food", "Travel", "Tech", "Gaming",
    "Lifestyle", "Parenting", "Finance", "Education", "Business", "Automobile",
    "Luxury", "Entertainment", "UGC Creator", "Local Creator"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Influencer CRM</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Search, segment, compare, and manage relationships with creator partners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Import CSV */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 py-1.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            {/* Add Influencer */}
            {currentUser?.role !== "viewer" && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Influencer
              </button>
            )}
          </div>
        </div>

        {/* Shortlist Tabs & Delete List */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-2 overflow-x-auto py-1.5 shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveListId("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                activeListId === "all"
                  ? "bg-secondary text-foreground"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              All Influencers
            </button>

            {lists.map(lst => (
              <div key={lst.id} className="flex items-center gap-1 group shrink-0">
                <button
                  onClick={() => setActiveListId(lst.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                    activeListId === lst.id
                      ? "bg-secondary text-foreground"
                      : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  {lst.name} ({lst.count})
                </button>
                {activeListId === lst.id && currentUser?.role !== "viewer" && (
                  <button
                    onClick={() => handleDeleteList(lst.id, lst.name)}
                    className="p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {currentUser?.role !== "viewer" && (
              <button
                onClick={() => setShowCreateListModal(true)}
                className="px-2 py-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Create List
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-3">
          {/* Search Row */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isAiSearch ? "e.g. Find fitness influencers in Mumbai with 10k–100k followers..." : "Search by name, username, bio, city..."}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500 text-foreground"
              />
            </div>
            
            {/* Search Action */}
            {isAiSearch ? (
              <button
                type="button"
                onClick={executeAiSearch}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Parse
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 border border-border rounded-xl hover:bg-secondary text-xs font-semibold cursor-pointer shrink-0"
              >
                Search
              </button>
            )}

            {/* AI Search Mode Toggle */}
            <button
              type="button"
              onClick={handleAiSearchToggle}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isAiSearch
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-border text-zinc-500 hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Search
            </button>
          </form>

          {/* Standard Filters Dropdown row (hidden in AI search mode to keep clean) */}
          {!isAiSearch && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Category */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Tier */}
              <div>
                <select
                  value={selectedTier}
                  onChange={e => setSelectedTier(e.target.value)}
                  className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300"
                >
                  <option value="">All Tiers</option>
                  <option value="Nano">Nano (1k-10k)</option>
                  <option value="Micro">Micro (10k-100k)</option>
                  <option value="Mid">Mid (100k-500k)</option>
                  <option value="Macro">Macro (500k-1M)</option>
                  <option value="Mega">Mega (1M+)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full bg-background border border-border text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300"
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Booked">Booked</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>

              {/* Followers filter */}
              <div className="flex items-center gap-1.5 border border-border bg-background rounded-xl px-2.5 py-1.5">
                <input
                  type="number"
                  placeholder="Min Followers"
                  value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  className="w-full bg-transparent text-[10px] focus:outline-none placeholder-zinc-500"
                />
              </div>

              {/* Max Reel Rate */}
              <div className="flex items-center gap-1.5 border border-border bg-background rounded-xl px-2.5 py-1.5">
                <input
                  type="number"
                  placeholder="Max Reel Rate"
                  value={maxReelRate}
                  onChange={e => setMaxReelRate(e.target.value)}
                  className="w-full bg-transparent text-[10px] focus:outline-none placeholder-zinc-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Influencers Directory Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10 text-zinc-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3 text-center w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-zinc-400 hover:text-foreground cursor-pointer"
                    >
                      {selectedIds.length === influencers.length && influencers.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Influencer</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Followers</th>
                  <th className="p-3">ER%</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Reel Price</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3">AI Grade</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {influencers.length > 0 ? (
                  influencers.map(inf => {
                    const isSelected = selectedIds.includes(inf.id);
                    return (
                      <tr key={inf.id} className={`hover:bg-secondary/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleSelect(inf.id)}
                            className="text-zinc-400 hover:text-foreground cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={inf.profile_photo}
                            alt={inf.full_name}
                            className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold block leading-tight text-zinc-900 dark:text-zinc-100">
                              {inf.full_name}
                            </span>
                            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">
                              @{inf.username}
                            </span>
                            <div className="flex gap-1.5 mt-1">
                              {inf.categories.slice(0, 2).map((cat: string) => (
                                <span key={cat} className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-zinc-600 dark:text-zinc-300">{inf.tier}</td>
                        <td className="p-3 font-bold">{formatNumber(inf.followers)}</td>
                        <td className="p-3 font-semibold text-emerald-500">{inf.engagement_rate}%</td>
                        <td className="p-3 text-zinc-500">{inf.city || "N/A"}</td>
                        <td className="p-3 font-bold">{inf.reel_price ? formatCurrency(inf.reel_price) : "Barter"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                            inf.availability_status === "Available"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : inf.availability_status === "Booked" || inf.availability_status === "Busy"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}>
                            {inf.availability_status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md font-extrabold text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                            {inf.overall_grade}
                          </span>
                        </td>
                        <td className="p-3 text-right flex justify-end gap-1.5">
                          {/* Actions */}
                          <button
                            onClick={() => router.push(`/influencers/${inf.id}`)}
                            className="p-1 hover:bg-secondary text-zinc-400 hover:text-foreground rounded transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {currentUser?.role !== "viewer" && (
                            <button
                              onClick={() => handleEditClick(inf)}
                              className="p-1 hover:bg-secondary text-zinc-400 hover:text-foreground rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {currentUser?.role === "super_admin" && (
                            <button
                              onClick={() => handleDeleteInfluencer(inf.id, inf.full_name)}
                              className="p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-zinc-500 text-xs font-semibold">
                      No influencers matching filters. Try modifying filters or search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between text-[11px] text-zinc-500">
            <span>Showing {influencers.length} influencers</span>
            <span>Total Combined Reach: {formatNumber(influencers.reduce((sum, inf) => sum + (inf.followers || 0), 0))} followers</span>
          </div>
        </div>

        {/* Shortlist Creation Modal */}
        {showCreateListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateListModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 z-10 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Create Saved Shortlist</h3>
                <button onClick={() => setShowCreateListModal(false)} className="text-zinc-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">List Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore Food Creators"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    placeholder="Describe list segmentation..."
                    value={newListDesc}
                    onChange={e => setNewListDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none h-20 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md hover:bg-indigo-500"
                >
                  Create Shortlist
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sticky Comparison Overlay Bar */}
        {selectedIds.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-zinc-50 shadow-2xl p-4 rounded-2xl flex items-center justify-between gap-6 z-[45] animate-bounce w-[400px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                {selectedIds.length}
              </div>
              <span className="text-xs font-semibold">Influencers selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="text-[10px] hover:underline text-zinc-400 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-indigo-500"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Compare Side-by-Side
              </button>
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompareModal(false)} />
            <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">Influencer Metrics Comparison</h3>
                <button onClick={() => setShowCompareModal(false)} className="text-zinc-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Side by side columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {influencers
                  .filter(inf => selectedIds.includes(inf.id))
                  .slice(0, 3) // limit to 3 comparison cards
                  .map(inf => (
                    <div key={inf.id} className="border border-border p-4 rounded-xl space-y-4 bg-zinc-50/25 dark:bg-zinc-900/10">
                      <div className="flex items-center gap-3">
                        <img src={inf.profile_photo} alt={inf.full_name} className="h-10 w-10 rounded-full object-cover border border-border" />
                        <div>
                          <h4 className="font-bold text-xs">{inf.full_name}</h4>
                          <span className="text-[10px] text-zinc-500 block">@{inf.username}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Followers</span>
                          <span className="font-bold">{formatNumber(inf.followers)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Engagement</span>
                          <span className="font-bold text-emerald-500">{inf.engagement_rate}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Tier</span>
                          <span>{inf.tier}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">AI Grade</span>
                          <span className="font-bold text-indigo-500">{inf.overall_grade}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Reel Rate</span>
                          <span className="font-bold">{inf.reel_price ? formatCurrency(inf.reel_price) : "Barter"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Story Rate</span>
                          <span className="font-bold">{inf.story_price ? formatCurrency(inf.story_price) : "Barter"}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border space-y-1 text-[11px]">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Demographics (F/M)</span>
                          <span>{inf.female_audience_pct}% Female / {inf.male_audience_pct}% Male</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-bold">Location</span>
                          <span>{inf.city}, {inf.state}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border text-[11px] space-y-1.5">
                        <span className="text-[10px] text-zinc-400 block font-bold">Agency Ratings</span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <span>Quality: {inf.content_quality_rating}/10</span>
                          <span>Comm: {inf.communication_rating}/10</span>
                          <span>Reliability: {inf.reliability_rating}/10</span>
                          <span>Fit: {inf.brand_fit_rating}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Influencer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-bold text-sm">{isEditMode ? "Edit Influencer Profile" : "Add New Influencer"}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border gap-4 mb-4 text-xs font-semibold text-zinc-500">
                <button
                  type="button"
                  onClick={() => setActiveFormTab("basic")}
                  className={`pb-2 ${activeFormTab === "basic" ? "border-b-2 border-primary text-primary" : ""}`}
                >
                  Basic Info & Socials
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("metrics")}
                  className={`pb-2 ${activeFormTab === "metrics" ? "border-b-2 border-primary text-primary" : ""}`}
                >
                  Audience & Pricing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("ratings")}
                  className={`pb-2 ${activeFormTab === "ratings" ? "border-b-2 border-primary text-primary" : ""}`}
                >
                  Ratings & Notes
                </button>
              </div>

              <form onSubmit={handleInfluencerFormSubmit} className="space-y-4">
                {activeFormTab === "basic" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={e => setFormUsername(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">City</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={e => setFormCity(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Instagram Handle</label>
                      <input
                        type="text"
                        value={formInstagram}
                        onChange={e => setFormInstagram(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Bio</label>
                      <textarea
                        value={formBio}
                        onChange={e => setFormBio(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-16 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Categories (Multi-select)</label>
                      <div className="flex flex-wrap gap-2">
                        {categoriesOptions.map(cat => {
                          const isSelected = formCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleFormCategory(cat)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-border hover:bg-secondary text-zinc-500"
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === "metrics" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Followers Count</label>
                      <input
                        type="number"
                        value={formFollowers}
                        onChange={e => setFormFollowers(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Engagement Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formER}
                        onChange={e => setFormER(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reel Price (₹)</label>
                      <input
                        type="number"
                        value={formReelRate}
                        onChange={e => setFormReelRate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Story Price (₹)</label>
                      <input
                        type="number"
                        value={formStoryRate}
                        onChange={e => setFormStoryRate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Availability Status</label>
                      <select
                        value={formAvailability}
                        onChange={e => setFormAvailability(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300"
                      >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="Booked">Booked</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blacklisted">Blacklisted</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeFormTab === "ratings" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Content Quality (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formQuality}
                        onChange={e => setFormQuality(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Communication Rating (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formCommunication}
                        onChange={e => setFormCommunication(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Agency Notes</label>
                      <textarea
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none h-24 resize-none"
                      />
                    </div>
                  </div>
                )}

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
                    className="py-1.5 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90"
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
