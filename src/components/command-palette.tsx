"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Briefcase,
  Layers,
  Moon,
  Sun,
  LogOut,
  MessageSquare,
  ShieldAlert,
  DollarSign,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useTheme } from "./theme-provider";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: any;
}

export default function CommandPalette({ open, setOpen, user }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Define static commands based on user permissions
  const commands = [
    { id: "nav-dash", name: "Go to Dashboard", category: "Navigation", icon: Layers, action: () => { router.push("/dashboard"); setOpen(false); } },
    { id: "nav-inf", name: "Go to Influencers Directory", category: "Navigation", icon: Users, action: () => { router.push("/influencers"); setOpen(false); } },
    { id: "nav-brand", name: "Go to Brand CRM", category: "Navigation", icon: Briefcase, action: () => { router.push("/brands"); setOpen(false); } },
    { id: "nav-camp", name: "Go to Campaigns Workspace", category: "Navigation", icon: Layers, action: () => { router.push("/campaigns"); setOpen(false); } },
    { id: "nav-wa", name: "Go to WhatsApp CRM", category: "Navigation", icon: MessageSquare, action: () => { router.push("/whatsapp"); setOpen(false); } },
  ];

  // Role-based command additions
  if (user && (user.role === "super_admin" || user.role === "admin")) {
    commands.push({
      id: "nav-finance",
      name: "Go to Finance Ledger",
      category: "Navigation",
      icon: DollarSign,
      action: () => { router.push("/finance"); setOpen(false); }
    });
  }

  if (user && user.role !== "viewer") {
    commands.push({
      id: "nav-reports",
      name: "Go to Reports & ROI",
      category: "Navigation",
      icon: BarChart3,
      action: () => { router.push("/reports"); setOpen(false); }
    });
  }

  // General settings & auth
  commands.push(
    { id: "toggle-dark", name: `Toggle ${theme === "light" ? "Dark" : "Light"} Mode`, category: "Preferences", icon: theme === "light" ? Moon : Sun, action: () => { toggleTheme(); setOpen(false); } },
    { id: "auth-out", name: "Sign Out from CRM", category: "Account", icon: LogOut, action: () => {
      fetch("/api/auth/logout", { method: "POST" }).then(() => {
        router.push("/login");
        setOpen(false);
      });
    } }
  );

  // Filter commands
  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamically append AI Creator Search query option if search string is entered
  const dynamicCommands = [...filteredCommands];
  if (search.trim().length > 0) {
    dynamicCommands.push({
      id: "ai-search",
      name: `AI Search: Find "${search}"`,
      category: "AI Query",
      icon: Sparkles,
      action: () => {
        router.push(`/influencers?ai=true&q=${encodeURIComponent(search)}`);
        setOpen(false);
      }
    });
  }

  // Handle escape to close, and arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % dynamicCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + dynamicCommands.length) % dynamicCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeCommand = dynamicCommands[selectedIndex];
        if (activeCommand) {
          activeCommand.action();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, search, dynamicCommands]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col z-[10001] animate-in fade-in zoom-in duration-200">
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-zinc-50/20 dark:bg-zinc-900/10">
          <Search className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 placeholder-zinc-500 text-foreground"
          />
          <span className="text-[10px] text-zinc-400 border border-border px-1.5 py-0.5 rounded-md font-mono">
            ESC
          </span>
        </div>

        {/* Commands List */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {dynamicCommands.length > 0 ? (
            dynamicCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{cmd.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-secondary text-zinc-500"
                  }`}>
                    {cmd.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldAlert className="h-6 w-6 text-zinc-500" />
              <p className="text-xs text-zinc-500 font-semibold mt-2">No matching commands found</p>
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="flex items-center gap-4 px-4 py-2 bg-secondary border-t border-border text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1">↑↓ Navigate</span>
          <span className="flex items-center gap-1">↵ Select</span>
        </div>
      </div>
    </div>
  );
}

