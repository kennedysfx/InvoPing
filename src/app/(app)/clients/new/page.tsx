"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/actions/clients";
import { ArrowLeft, Loader2, User, Building, Mail, Phone, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Client name is required.");
      return;
    }

    setLoading(true);
    const res = await createClientAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("Client added successfully!");
      router.push("/clients");
    } else {
      toast.error(res.error || "Failed to add client.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Add New Client</h1>
          <p className="text-xs text-slate-400 mt-0.5">Enter contact and WhatsApp details for your client</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Client Full Name *</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Company Name</label>
              <div className="relative">
                <Building className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="TechCorp Inc"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@techcorp.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                placeholder="+1 415 555 0122"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="block text-[11px] text-slate-500 mt-1">Include country code for instant WhatsApp Click-to-Chat integration.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Billing Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="500 Howard St, San Francisco, CA"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about payment terms or preferences..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link href="/clients" className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-medium">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
