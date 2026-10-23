import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { invoices, clients, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, FileText, Download, MessageSquare, ExternalLink } from "lucide-react";
import { buildWhatsAppClickToChatUrl, DEFAULT_REMINDER_TEMPLATES, interpolateTemplate } from "@/lib/whatsapp/message";

export const dynamic = "force-dynamic";

export default async function InvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));

  const allInvoices = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.businessId, businessId))
    .orderBy(desc(invoices.createdAt));

  const filteredInvoices = status && status !== "ALL"
    ? allInvoices.filter(({ invoice }: { invoice: typeof invoices.$inferSelect; clientName: string | null; clientPhone: string | null }) => invoice.status === status.toUpperCase())
    : allInvoices;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">Create, share, track and manage your business invoices</p>
        </div>

        <Link
          href="/invoices/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
        {["ALL", "DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE"].map((st) => {
          const isActive = (status || "ALL").toUpperCase() === st;
          return (
            <Link
              key={st}
              href={st === "ALL" ? "/invoices" : `/invoices?status=${st}`}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {st}
            </Link>
          );
        })}
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No invoices found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {status ? `No invoices match the status "${status}".` : "Create your first invoice to get paid via WhatsApp."}
          </p>
          <Link
            href="/invoices/new"
            className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3.5 px-4">Number</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredInvoices.map(({ invoice, clientName, clientPhone }: { invoice: typeof invoices.$inferSelect; clientName: string | null; clientPhone: string | null }) => {
                  const waMessage = interpolateTemplate(DEFAULT_REMINDER_TEMPLATES.invoice_share.template, {
                    clientName: clientName || "Client",
                    businessName: biz?.name || "Business",
                    invoiceNumber: invoice.number,
                    currency: invoice.currency,
                    total: invoice.total,
                    balance: invoice.balanceDue,
                    dueDate: invoice.dueDate,
                    publicUrl: `${appUrl}/i/${invoice.publicToken}`,
                  });
                  const waUrl = buildWhatsAppClickToChatUrl(clientPhone || "", waMessage);

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-white">{invoice.number}</td>
                      <td className="py-4 px-4 font-medium">{clientName || "Unknown"}</td>
                      <td className="py-4 px-4 text-slate-400">{invoice.issueDate}</td>
                      <td className="py-4 px-4 text-slate-400">{invoice.dueDate}</td>
                      <td className="py-4 px-4 font-bold text-white">{invoice.currency} {invoice.total}</td>
                      <td className="py-4 px-4 font-bold text-amber-400">{invoice.currency} {invoice.balanceDue}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            invoice.status === "PAID"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                              : invoice.status === "OVERDUE"
                              ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                              : invoice.status === "VIEWED"
                              ? "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                              : invoice.status === "SENT"
                              ? "bg-blue-950 text-blue-400 border border-blue-800/60"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {clientPhone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900 transition-colors"
                              title="Send via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={`/api/invoices/${invoice.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-xs text-slate-200 hover:text-white px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 font-semibold"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
