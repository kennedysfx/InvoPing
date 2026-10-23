"use client";

import { useState } from "react";
import { updateBusinessSettingsAction } from "@/actions/settings";
import { Building, Mail, Phone, MapPin, CreditCard, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/config/plans";

export default function SettingsClientForm({ business, planStatus }: { business: any; planStatus: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
    currency: business?.currency || "USD",
    paymentInstructions: business?.paymentInstructions || "",
    invoicePrefix: business?.invoicePrefix || "INV-",
    logoUrl: business?.logoUrl || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateBusinessSettingsAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("Business settings saved!");
    } else {
      toast.error(res.error || "Failed to update settings.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Business Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your business profile, default payment instructions, and plan subscription</p>
      </div>

      {/* Subscription Plan Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Current Subscription Plan</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-extrabold text-white">{planStatus.plan.name} Plan</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-800">
                ${planStatus.plan.price}/mo
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            Usage this month: <span className="font-bold text-white">{planStatus.currentMonthInvoices} / {planStatus.invoiceLimit === Infinity ? "Unlimited" : planStatus.invoiceLimit} invoices</span>
          </div>
        </div>

        {/* Plan Cards comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {Object.values(PLANS).map((p) => {
            const isCurrent = p.id === planStatus.plan.id;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border flex flex-col justify-between text-xs ${
                  isCurrent ? "bg-slate-950 border-emerald-500/80" : "bg-slate-950/40 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{p.name}</span>
                    {isCurrent && <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">Active</span>}
                  </div>
                  <span className="text-lg font-extrabold text-white">${p.price}/mo</span>
                  <p className="text-[11px] text-slate-400 mt-2">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile & Settings Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-base font-bold text-white">Business Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Business Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Business Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">WhatsApp / Business Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Default Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Business Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Default Payment Instructions</label>
            <textarea
              rows={4}
              value={formData.paymentInstructions}
              onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
