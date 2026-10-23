import { db } from "@/db";
import { invoices, invoiceItems, clients, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, Download, ShieldCheck } from "lucide-react";
import { computeInvoiceStatus } from "@/lib/invoices/calculations";
import { getBusinessPlanStatus } from "@/lib/subscriptions/limits";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invoiceRecords = await db
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.publicToken, token));

  if (!invoiceRecords.length) {
    notFound();
  }

  const { invoice, client } = invoiceRecords[0];

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, invoice.businessId));

  // Record View Tracking on first view
  if (!invoice.firstViewedAt || invoice.status === "SENT") {
    const nextStatus = invoice.status === "SENT" ? "VIEWED" : invoice.status;
    await db
      .update(invoices)
      .set({
        firstViewedAt: invoice.firstViewedAt || new Date(),
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));
  }

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(invoiceItems.sortOrder);

  const planStatus = await getBusinessPlanStatus(invoice.businessId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Official Invoice from {biz?.name}</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
              invoice.status === "PAID"
                ? "bg-emerald-600 text-white"
                : "bg-amber-950 text-amber-400 border border-amber-800"
            }`}
          >
            {invoice.status === "PAID" ? "Paid in Full" : `Balance: ${invoice.currency} ${invoice.balanceDue}`}
          </span>
        </div>

        {/* Invoice Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-extrabold text-white">{biz?.name}</h1>
              <p className="text-xs text-slate-400 mt-1">{biz?.email} • {biz?.phone}</p>
              {biz?.address && <p className="text-xs text-slate-500 mt-0.5">{biz.address}</p>}
            </div>

            <div className="sm:text-right">
              <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight">INVOICE</h2>
              <p className="text-xs font-mono text-slate-300 mt-1"># {invoice.number}</p>
              <p className="text-xs text-slate-400 mt-1">Issue Date: <span className="text-white">{invoice.issueDate}</span></p>
              <p className="text-xs text-slate-400">Due Date: <span className="text-white">{invoice.dueDate}</span></p>
            </div>
          </div>

          {/* Billed To */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Billed To</span>
              <p className="text-sm font-bold text-white">{client?.name}</p>
              {client?.company && <p className="text-xs text-emerald-400">{client.company}</p>}
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Amount</span>
              <p className="text-xl font-extrabold text-white">{invoice.currency} {invoice.total}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3 px-3">Item & Description</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Rate ({invoice.currency})</th>
                  <th className="py-3 px-3 text-right">Amount ({invoice.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {items.map((it: typeof invoiceItems.$inferSelect, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-3 font-medium text-white">{it.description}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{it.quantity}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{it.unitPrice}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-white">{it.amount}</td>
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

          {/* Payment Instructions */}
          {biz?.paymentInstructions && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Payment Instructions</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{biz.paymentInstructions}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            {!planStatus.plan.features.removeBranding ? (
              <p>Powered by <span className="font-bold text-slate-400">InvoPing</span> — Create invoices. Send on WhatsApp. Get paid.</p>
            ) : (
              <p>Thank you for doing business with {biz?.name}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
