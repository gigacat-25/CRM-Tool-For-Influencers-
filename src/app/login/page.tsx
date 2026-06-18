"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNotifications } from "@/components/notification-provider";

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useNotifications();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      pushToast({
        type: "error",
        title: "Validation Error",
        message: "Please enter both email and password."
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      pushToast({
        type: "success",
        title: "Welcome Back",
        message: `Successfully logged in as ${data.user.name}`
      });

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Login Failed",
        message: err.message || "Something went wrong."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string, roleName: string) => {
    setSelectedRole(roleName);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: roleEmail, password: "password123" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      pushToast({
        type: "success",
        title: "Welcome Back",
        message: `Successfully logged in as ${data.user.name} (${roleName})`
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "Login Failed",
        message: err.message || "Something went wrong."
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      name: "Super Admin",
      email: "superadmin@thescene.co",
      desc: "Full read, write, finance, & delete permissions.",
      color: "border-indigo-500/30 hover:border-indigo-500 text-indigo-400 bg-indigo-500/5"
    },
    {
      name: "Admin",
      email: "admin@thescene.co",
      desc: "Create & edit all items, access finance. No deletion.",
      color: "border-emerald-500/30 hover:border-emerald-500 text-emerald-400 bg-emerald-500/5"
    },
    {
      name: "Manager",
      email: "manager@thescene.co",
      desc: "Create/edit campaigns & influencers. Finance blocked.",
      color: "border-amber-500/30 hover:border-amber-500 text-amber-400 bg-amber-500/5"
    },
    {
      name: "Viewer",
      email: "viewer@thescene.co",
      desc: "Read-only access. Campaigns, CRM, & Finance restricted.",
      color: "border-zinc-500/30 hover:border-zinc-500 text-zinc-400 bg-zinc-500/5"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Background Neon Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[150px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-sans font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-indigo-300">
            The Scene Co.
          </span>
        </div>

        {/* Form Glass Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-zinc-50 tracking-tight text-center">
            Sign in to platform
          </h2>
          <p className="text-xs text-zinc-500 text-center mt-1">
            Access your campaign workspaces and influencer lists.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading && !selectedRole ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/60"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-950 px-2 text-zinc-500 font-semibold uppercase tracking-wider">
                Quick Demo Access
              </span>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {demoRoles.map(role => (
              <button
                key={role.name}
                type="button"
                onClick={() => handleQuickLogin(role.email, role.name)}
                disabled={loading}
                className={`flex flex-col text-left p-3 border rounded-xl transition-all active:scale-[0.97] cursor-pointer group ${role.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-zinc-200 group-hover:text-zinc-50">
                    {role.name}
                  </span>
                  {loading && selectedRole === role.name ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  {role.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
