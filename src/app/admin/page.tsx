"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { adminLoginAction } from "@/actions/admin";
import { AuthCloseButton } from "@/components/layout/AuthCloseButton";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await adminLoginAction(formData);
    setLoading(false);

    if (res.success && res.redirectUrl) {
      toast.success("Welcome Admin Kennedy");
      router.push(res.redirectUrl);
    } else {
      toast.error(res.error || "Invalid administrator credentials.");
    }
  }

 return (
  <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
    <AuthCloseButton />
      <div className="w-full max-w-md">
<div className="mb-8 text-center">
  <BrandLogo variant="dark" />

  <h1 className="mt-4 text-xl font-bold text-white">
    Admin Sign In
  </h1>

  <p className="mt-1 text-xs text-slate-400">
    Platform Management Administration System
  </p>
</div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@invoping.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>

<div className="relative">
  <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />

  <input
    type={showPassword ? "text" : "password"}
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••••••"
    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-12 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    aria-pressed={showPassword}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
  >
    {showPassword ? (
      <EyeOff className="w-5 h-5" />
    ) : (
      <Eye className="w-5 h-5" />
    )}
  </button>
</div>
</div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          This portal is restricted strictly to the administrator only.
        </p>
      </div>
    </div>
  );
}
