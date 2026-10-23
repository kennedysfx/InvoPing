"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/actions/onboarding";
import { Building, Mail, Phone, MapPin, DollarSign, CreditCard, ArrowRight, Loader2, MessageSquareShare } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    phone: "",
    address: "",
    currency: "USD",
    paymentInstructions: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.businessName || !formData.businessEmail) {
      toast.error("Please fill in business name and email.");
      return;
    }

    setLoading(true);
    const res = await completeOnboardingAction(formData);
    setLoading(false);

    if (res.success && res.redirectUrl) {
      toast.success("Business profile set up successfully!");
      router.push(res.redirectUrl);
    } else {
      toast.error(res.error || "Failed to set up business profile.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              <MessageSquareShare className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">
              Invo<span className="text-emerald-400">Ping</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome! Set up your Business Profile</h1>
          <p className="mt-1 text-xs text-slate-400">This information will appear on your invoices and WhatsApp payment links.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Business Name *</label>
              <div className="relative">
                <Building className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Acme Design Studio"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Business Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Business Email *</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    placeholder="billing@acme.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">WhatsApp / Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 415 555 0199"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Currency & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Default Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Business Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="100 Market St, San Francisco, CA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Default Payment Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Default Payment Instructions</label>
              <textarea
                rows={3}
                value={formData.paymentInstructions}
                onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                placeholder="Bank Name: Silicon Valley Bank&#10;Account No: 9876543210&#10;PayPal: pay@acmedesign.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <span className="block text-[11px] text-slate-500 mt-1">Clients will see these instructions on public invoice links.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup & Launch Dashboard"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
