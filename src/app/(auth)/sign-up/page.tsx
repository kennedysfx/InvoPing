"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useRouter } from "next/navigation";
import { AuthCloseButton } from "@/components/layout/AuthCloseButton";
import { requestSignUpOtpAction, verifySignUpOtpAction } from "@/actions/auth";
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("email", email);

    try {
      const res = await requestSignUpOtpAction(formData);

      if (res.success) {
        setStep("OTP");
        toast.success("Verification code sent to your email!");
      } else {
        toast.error(res.error || "Failed to send code.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    setLoading(true);

    try {
      const res = await verifySignUpOtpAction(email, code);

      if (res.success && res.redirectUrl) {
        toast.success("Welcome to InvoPing! Your account is ready.");
        router.push(res.redirectUrl);
      } else {
        toast.error(res.error || "Invalid verification code.");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

 return (
  <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
    <AuthCloseButton homeOnly />
      <div className="w-full max-w-md">
        {/* Reserved Space for InvoPing Platform Logo */}
        <div className="text-center mb-8">
<BrandLogo variant="dark" />
          <h1 className="mt-4 text-xl font-bold text-white">
            Create your Account
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Passwordless account creation with email verification code
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          {step === "EMAIL" ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Account & Send Code"
                )}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  Registration code sent to{" "}
                  <span className="font-semibold text-white">
                    {email}
                  </span>.
                  Please check your email for the verification code.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-lg font-mono tracking-widest text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify & Get Started"
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setCode("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-emerald-400 font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}