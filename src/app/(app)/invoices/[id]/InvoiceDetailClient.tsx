
"use client";

import { useState } from "react";
import Link from "next/link";
import { markInvoiceSharedAction } from "@/actions/invoices";
import { recordPaymentAction } from "@/actions/payments";
import { logReminderInitiatedAction } from "@/actions/reminders";
import {
  ArrowLeft,
  MessageSquare,
  Download,
  ExternalLink,
  CreditCard,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Bell,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppClickToChatUrl, DEFAULT_REMINDER_TEMPLATES, interpolateTemplate } from "@/lib/whatsapp/message";

export default function InvoiceDetailClient({
  invoice,
  client,
  items,
  business,
  payments,
  planConfig,
}: {
  invoice: any;
  client: any;
  items: any[];
  business: any;
  payments: any[];
  planConfig: any;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.balanceDue);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderType, setSelectedReminderType] = useState("friendly");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const publicUrl = `${appUrl}/i/${invoice.publicToken}`;

  // Build default WhatsApp message
  const defaultWaText = interpolateTemplate(DEFAULT_REMINDER_TEMPLATES.invoice_share.template, {
    clientName: client?.name || "Client",
    businessName: business?.name || "Business",
    invoiceNumber: invoice.number,
    currency: invoice.currency,
    total: invoice.total,
    balance: invoice.balanceDue,
    dueDate: invoice.dueDate,
    publicUrl,
  });

  const waClickUrl = buildWhatsAppClickToChatUrl(client?.phone || "", defaultWaText);


async function handleWhatsAppShare() {
  if (!client?.phone) {
    toast.error("This client has no WhatsApp phone number.");
    return;
  }

  // Open WhatsApp immediately from the user's click.
  window.location.assign(waClickUrl);
}


  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentLoading(true);

    const res = await recordPaymentAction({
      invoiceId: invoice.id,
      amount: paymentAmount,
      paymentDate,
      method: paymentMethod,
      reference: paymentRef,
    });

    setPaymentLoading(false);
    if (res.success) {
      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to record payment.");
    }
  }

  function openReminderModal() {
    const tmpl = DEFAULT_REMINDER_TEMPLATES[selectedReminderType] || DEFAULT_REMINDER_TEMPLATES.friendly;
    const msg = interpolateTemplate(tmpl.template, {
      clientName: client?.name || "Client",
      businessName: business?.name || "Business",
      invoiceNumber: invoice.number,
      currency: invoice.currency,
      total: invoice.total,
      balance: invoice.balanceDue,
      dueDate: invoice.dueDate,
      publicUrl,
    });
    setReminderMessage(msg);
    setShowReminderModal(true);
  }

  function handleReminderTypeChange(type: string) {
    setSelectedReminderType(type);
    const tmpl = DEFAULT_REMINDER_TEMPLATES[type] || DEFAULT_REMINDER_TEMPLATES.friendly;
    const msg = interpolateTemplate(tmpl.template, {
      clientName: client?.name || "Client",
      businessName: business?.name || "Business",
      invoiceNumber: invoice.number,
      currency: invoice.currency,
      total: invoice.total,
      balance: invoice.balanceDue,
      dueDate: invoice.dueDate,
      publicUrl,
    });
    setReminderMessage(msg);
  }


async function handleSendReminderWhatsApp() {
  if (reminderLoading) return;

  if (!client?.phone) {
    toast.error("This client has no WhatsApp phone number.");
    return;
  }

  if (!reminderMessage.trim()) {
    toast.error("Please enter a reminder message.");
    return;
  }

  const url = buildWhatsAppClickToChatUrl(
    client.phone,
    reminderMessage
  );

  // Open WhatsApp immediately to avoid popup blocking.
  const whatsappWindow = window.open(url, "_blank");

  if (!whatsappWindow) {
    // Fallback for mobile browsers that block new tabs.
    window.location.assign(url);
    return;
  }

  setShowReminderModal(false);

  // Record that the reminder was initiated, not delivered.
  setReminderLoading(true);

  try {
    await logReminderInitiatedAction(
      invoice.id,
      selectedReminderType,
      reminderMessage
    );
  } catch (error) {
    console.error("Failed to record reminder initiation:", error);
  } finally {
    setReminderLoading(false);
  }
}


  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white font-mono">{invoice.number}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  invoice.status === "PAID"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : invoice.status === "OVERDUE"
                    ? "bg-rose-950 text-rose-400 border border-rose-800"
                    : invoice.status === "VIEWED"
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Issued to <span className="text-white font-semibold">{client?.name}</span></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {client?.phone && (
            <button
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </button>
          )}

          {parseFloat(invoice.balanceDue) > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {parseFloat(invoice.balanceDue) > 0 && client?.phone && (
            <button
              onClick={openReminderModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Send Reminder</span>
            </button>
          )}

          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </a>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            title="Open Public Link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Edit Invoice"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Invoice Sheet Document Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto space-y-8 shadow-2xl">
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">{business?.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{business?.email} • {business?.phone}</p>
            {business?.address && <p className="text-xs text-slate-500 mt-0.5">{business?.address}</p>}
          </div>
          <div className="sm:text-right">
            <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight">INVOICE</h2>
            <p className="text-xs font-mono text-slate-300 mt-1"># {invoice.number}</p>
            <p className="text-xs text-slate-400 mt-1">Issue Date: <span className="text-white">{invoice.issueDate}</span></p>
            <p className="text-xs text-slate-400">Due Date: <span className="text-white">{invoice.dueDate}</span></p>
          </div>
        </div>

        {/* Billed To Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Billed To</span>
            <p className="text-sm font-bold text-white">{client?.name}</p>
            {client?.company && <p className="text-xs text-emerald-400">{client.company}</p>}
            {client?.email && <p className="text-xs text-slate-400">{client.email}</p>}
            {client?.phone && <p className="text-xs text-slate-400">{client.phone}</p>}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Status</span>
            <p className={`text-base font-extrabold ${parseFloat(invoice.balanceDue) === 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {parseFloat(invoice.balanceDue) === 0 ? "PAID IN FULL" : `BALANCE DUE: ${invoice.currency} ${invoice.balanceDue}`}
            </p>
            {invoice.firstViewedAt && (
              <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Viewed by client on {new Date(invoice.firstViewedAt).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Rate ({invoice.currency})</th>
                <th className="py-3 px-3 text-right">Amount ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-3 font-medium text-white">{item.description}</td>
                  <td className="py-3.5 px-3 text-right font-mono">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-mono">{item.unitPrice}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-white">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{invoice.currency} {invoice.subtotal}</span>
            </div>
            {parseFloat(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({invoice.taxRate}%):</span>
                <span className="font-semibold text-white">{invoice.currency} {invoice.taxAmount}</span>
              </div>
            )}
            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Discount ({invoice.discountRate}%):</span>
                <span className="font-semibold text-white">-{invoice.currency} {invoice.discountAmount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total:</span>
              <span className="text-emerald-400">{invoice.currency} {invoice.total}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Amount Paid:</span>
              <span className="font-semibold text-white">{invoice.currency} {invoice.amountPaid}</span>
            </div>
            <div className="flex justify-between text-rose-400 font-bold">
              <span>Balance Due:</span>
              <span>{invoice.currency} {invoice.balanceDue}</span>
            </div>
          </div>
        </div>

        {/* Payment Instructions & Notes */}
        {invoice.paymentInstructions && (
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Instructions</h4>
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{invoice.paymentInstructions}</p>
          </div>
        )}

        {/* Payment History List */}
        {payments.length > 0 && (
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-bold text-white mb-3">Recorded Payment Transactions</h3>
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{p.method} {p.reference ? `(${p.reference})` : ""}</span>
                    <span className="text-[10px] text-slate-400">{p.paymentDate}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+{invoice.currency} {p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Amount ({invoice.currency})</label>
                <input
                  type="number"
                  step="any"
                  max={parseFloat(invoice.balanceDue)}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="TXN-998123"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  {paymentLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <span>Send WhatsApp Reminder</span>
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Reminder Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "friendly", label: "Friendly" },
                    { id: "due_today", label: "Due Today" },
                    { id: "overdue", label: "Overdue" },
                    { id: "final", label: "Final Notice" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleReminderTypeChange(cat.id)}
                      className={`py-2 px-3 rounded-lg border font-semibold text-xs ${
                        selectedReminderType === cat.id
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Preview (Editable)</label>
                <textarea
                  rows={5}
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminderWhatsApp}
                  disabled={reminderLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  {reminderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                  <span>Open WhatsApp with Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
