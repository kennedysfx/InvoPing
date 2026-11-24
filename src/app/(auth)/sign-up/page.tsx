"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { AuthCloseButton } from "@/components/layout/AuthCloseButton";
import EarlyAccessModal from "@/components/auth/EarlyAccessModal";
import { registerEarlyAccessAction } from "@/actions/early-access";

export default function SignUpPage() {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(true);

  return (
    <>
      <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
        <AuthCloseButton homeOnly />

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <BrandLogo variant="dark" />

            <h1 className="mt-4 text-xl font-bold text-white">
              InvoPing Early Access
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Join our list and be notified when InvoPing launches.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
            <p className="text-sm leading-6 text-slate-300">
              We're preparing InvoPing to make invoicing, WhatsApp sharing
              and payment tracking simpler for your business.
            </p>

            <button
              type="button"
              onClick={() => setEarlyAccessOpen(true)}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm"
            >
              Join Early Access
            </button>
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

      <EarlyAccessModal
        open={earlyAccessOpen}
        onClose={() => setEarlyAccessOpen(false)}
        onSubmit={registerEarlyAccessAction}
      />
    </>
  );
}