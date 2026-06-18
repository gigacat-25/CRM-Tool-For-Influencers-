"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  MessageSquare,
  DollarSign,
  BarChart3,
  LogOut,
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  User,
  Settings,
  ShieldAlert
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { useNotifications } from "./notification-provider";
import CommandPalette from "./command-palette";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "viewer";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { toasts, pushToast } = useNotifications();
  
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Handle Command Palette trigger (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        pushToast({
          type: "info",
          title: "Logged Out",
          message: "You have been successfully logged out."
        });
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      pushToast({
        type: "error",
        title: "Logout Error",
        message: "Failed to sign out. Try again."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-zinc-400 text-xs mt-3 tracking-wider uppercase font-semibold">Loading Workspace...</span>
      </div>
    );
  }

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    viewer: "Viewer"
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "manager", "viewer"] },
    { name: "Influencers", href: "/influencers", icon: Users, roles: ["super_admin", "admin", "manager", "viewer"] },
    { name: "Brands CRM", href: "/brands", icon: Briefcase, roles: ["super_admin", "admin", "manager", "viewer"] },
    { name: "Campaigns", href: "/campaigns", icon: Layers, roles: ["super_admin", "admin", "manager", "viewer"] },
    { name: "WhatsApp CRM", href: "/whatsapp", icon: MessageSquare, roles: ["super_admin", "admin", "manager", "viewer"] },
    { name: "Finance Ledger", href: "/finance", icon: DollarSign, roles: ["super_admin", "admin"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["super_admin", "admin", "manager"] }
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
            <LayoutDashboard className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-400">
            The Scene Co.
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Profile */}
        <div className="p-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold truncate">{user?.name}</h4>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                {user ? roleLabels[user.role] : ""}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-border text-zinc-500 hover:text-foreground transition-colors cursor-pointer"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full mt-4 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-card border-r border-border h-full z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
                  <LayoutDashboard className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-bold text-lg text-indigo-500">The Scene Co.</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {filteredNavItems.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-zinc-500 hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{user?.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    {user ? roleLabels[user.role] : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex justify-center py-1.5 border border-border rounded-xl text-zinc-500 text-xs font-semibold gap-2 items-center cursor-pointer"
                >
                  {theme === "light" ? <><Moon className="h-4 w-4" /> Dark</> : <><Sun className="h-4 w-4" /> Light</>}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex justify-center py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-rose-500 text-xs font-semibold gap-2 items-center cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-zinc-500 hover:text-foreground cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Quick Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 text-zinc-400 hover:text-zinc-500 border border-border bg-background px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm w-64 text-left cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <span>Search platform...</span>
              <kbd className="ml-auto bg-secondary border border-border px-1.5 py-0.5 rounded-md text-[9px] text-zinc-400 font-mono">
                Ctrl + K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 border border-border rounded-xl text-zinc-500 hover:text-foreground hover:bg-secondary transition-colors relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-600 rounded-full animate-pulse" />
              </button>

              {/* Notification Overlay Menu */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                      <h3 className="font-bold text-xs">Activity Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] text-indigo-500 font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto py-1">
                      <div className="text-xs p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">Campaign Alert</p>
                        <p className="text-zinc-500 mt-0.5">Zara Summer Trends campaign draft approved by client.</p>
                        <span className="text-[9px] text-zinc-400 block mt-1">10 minutes ago</span>
                      </div>
                      <div className="text-xs p-2 rounded-lg hover:bg-secondary transition-colors">
                        <p className="font-semibold">WhatsApp Outreach</p>
                        <p className="text-zinc-500 mt-0.5">Automated collab draft generated for Amit Gowda.</p>
                        <span className="text-[9px] text-zinc-400 block mt-1">1 hour ago</span>
                      </div>
                      <div className="text-xs p-2 rounded-lg hover:bg-secondary transition-colors">
                        <p className="font-semibold text-rose-500">Payment Due</p>
                        <p className="text-zinc-500 mt-0.5">Influencer payout invoice due in 2 days for Priya Sharma.</p>
                        <span className="text-[9px] text-zinc-400 block mt-1">4 hours ago</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 dark:bg-zinc-900/10 fade-in">
          {children}
        </main>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandPalette open={commandPaletteOpen} setOpen={setCommandPaletteOpen} user={user} />
    </div>
  );
}

