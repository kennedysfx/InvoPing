"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceAction, updateInvoiceAction } from "@/actions/invoices";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { calculateInvoiceTotals } from "@/lib/invoices/calculations";

type ExistingInvoice = {
  id: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  taxRate: string;
  discountRate: string;
  notes: string;
  paymentInstructions: string;
  amountPaid: string;
  items: {
    description: string;
    quantity: string;
    unitPrice: string;
  }[];
};

export default function NewInvoiceForm({
  clients,
  defaultClientId,
  business,
  existingInvoice,
}: {
  clients: any[];
  defaultClientId?: string;
  business?: any;
  existingInvoice?: ExistingInvoice;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDueStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

const [clientId, setClientId] = useState(
  existingInvoice?.clientId || defaultClientId || clients[0]?.id || ""
);

const [issueDate, setIssueDate] = useState(
  existingInvoice?.issueDate || todayStr
);

const [dueDate, setDueDate] = useState(
  existingInvoice?.dueDate || defaultDueStr
);

const [currency, setCurrency] = useState(
  existingInvoice?.currency || business?.currency || "USD"
);

const [taxRate, setTaxRate] = useState<number | string>(
  existingInvoice?.taxRate ?? 0
);

const [discountRate, setDiscountRate] = useState<number | string>(
  existingInvoice?.discountRate ?? 0
);

const [notes, setNotes] = useState(
  existingInvoice?.notes ?? "Thank you for your business!"
);

const [paymentInstructions, setPaymentInstructions] = useState(
  existingInvoice?.paymentInstructions ??
    business?.paymentInstructions ??
    ""
);

const [items, setItems] = useState<
  Array<{
    description: string;
    quantity: string | number;
    unitPrice: string | number;
  }>
>(
  existingInvoice?.items.length
    ? existingInvoice.items
    : [{ description: "Services rendered", quantity: 1, unitPrice: 100 }]
);

  // Validate input separately from strict financial calculations.
  // An empty field while typing must never throw during React rendering.
  const positiveNumber = (value: number | string): boolean => {
    const text = String(value).trim();
    return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0;
  };

  const validRate = (value: number | string): boolean => {
    const text = String(value).trim();
    return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) <= 100;
  };

  const itemErrors = items.map((item) => ({
    description: item.description.trim() ? "" : "Description is required.",
    quantity: positiveNumber(item.quantity) ? "" : "Enter a quantity greater than zero (up to 2 decimals).",
    unitPrice: positiveNumber(item.unitPrice) ? "" : "Enter a price greater than zero (up to 2 decimals).",
  }));
  const taxError = validRate(taxRate) ? "" : "Tax must be between 0% and 100% (up to 2 decimals).";
  const discountError = validRate(discountRate) ? "" : "Discount must be between 0% and 100% (up to 2 decimals).";
  const fieldsValid = itemErrors.every((item) => !item.description && !item.quantity && !item.unitPrice) && !taxError && !discountError;

let totals: ReturnType<typeof calculateInvoiceTotals> | null = null;
let calculationError = "";

if (fieldsValid) {
  try {
    totals = calculateInvoiceTotals(
  items,
  taxRate,
  discountRate,
  existingInvoice?.amountPaid ?? 0
);

    const finalTotal = Number(totals.total);
    const isFullyDiscounted = Number(discountRate) === 100;

    if (finalTotal < 0) {
      calculationError = "Invoice total cannot be negative.";
      totals = null;
    } else if (finalTotal === 0 && !isFullyDiscounted) {
      calculationError =
        "Invoice total must be greater than zero unless fully discounted.";
      totals = null;
    }
  } catch (error) {
    calculationError =
      error instanceof Error
        ? error.message
        : "Invalid invoice amounts.";

    totals = null;
  }
}

const canSave =
  fieldsValid &&
  totals !== null &&
  !calculationError;


  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: "" }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: any) {
    const next = [...items];
    (next[index] as any)[field] = value;
    setItems(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      toast.error("All line items must have a description.");
      return;
    }

    if (!canSave) {
      toast.error(calculationError || "Correct the highlighted invoice fields before saving.");
      return;
    }

    setLoading(true);
    try {
const payload = {
  clientId,
  issueDate,
  dueDate,
  currency,
  taxRate,
  discountRate,
  notes,
  paymentInstructions,
  items,
};

if (existingInvoice) {
  const res = await updateInvoiceAction(existingInvoice.id, payload);

  if (res.success) {
    toast.success("Invoice updated successfully!");
    router.push(`/invoices/${existingInvoice.id}`);
    router.refresh();
  } else {
    toast.error(res.error || "Failed to update invoice.");
  }
} else {
  const res = await createInvoiceAction(payload);

  if (res.success && res.invoiceId) {
    toast.success("Invoice created successfully!");
    router.push(`/invoices/${res.invoiceId}`);
    router.refresh();
  } else {
    toast.error(res.error || "Failed to create invoice.");
  }
}
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
  {existingInvoice ? "Edit Invoice" : "Create New Invoice"}
</h1>
          <p className="text-xs text-slate-400 mt-0.5">Fill in details, line items, and payment terms</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Client *</label>
              {clients.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                  No clients available. <Link href="/clients/new" className="underline font-bold">Add a client first</Link>.
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
              <label className="block text-xs font-semibold text-slate-300 mb-2">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Line Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const q = typeof item.quantity === "string" ? parseFloat(item.quantity) || 0 : item.quantity;
              const p = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) || 0 : item.unitPrice;
              const lineTotal = positiveNumber(item.quantity) && positiveNumber(item.unitPrice) ? (q * p).toFixed(2) : "—";

              return (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Item description (e.g. Website Design)"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {itemErrors[idx].description && <p className="text-xs text-rose-400 mt-1">{itemErrors[idx].description}</p>}
                  </div>

                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 text-right"
                    />
                    {itemErrors[idx].quantity && <p className="text-xs text-rose-400 mt-1">{itemErrors[idx].quantity}</p>}
                  </div>

                  <div className="w-full sm:w-32">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 text-right"
                    />
                    {itemErrors[idx].unitPrice && <p className="text-xs text-rose-400 mt-1">{itemErrors[idx].unitPrice}</p>}
                  </div>

                  <div className="w-full sm:w-28 text-right font-mono font-bold text-xs text-white">
                    {currency} {lineTotal}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals & Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Payment Instructions</label>
              <textarea
                rows={3}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Bank Name, Account Number, PayPal..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business!"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{currency} {totals?.subtotal ?? "—"}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">Tax Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 text-right focus:outline-none focus:border-emerald-500"
                />
                {taxError && <p className="text-xs text-rose-400">{taxError}</p>}
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">Discount Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 text-right focus:outline-none focus:border-emerald-500"
                />
                {discountError && <p className="text-xs text-rose-400">{discountError}</p>}
              </div>

              {calculationError && <p className="text-xs text-rose-400">{calculationError}</p>}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-xl font-extrabold text-emerald-400">{currency} {totals?.total ?? "—"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link href="/invoices" className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-medium">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || clients.length === 0 || !canSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
