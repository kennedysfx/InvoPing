import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Mail, Phone, MapPin, FileText, Plus, MessageSquare } from "lucide-react";
import { formatMoneyDecimal } from "@/lib/invoices/calculations";
import { buildWhatsAppClickToChatUrl } from "@/lib/whatsapp/message";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const clientList = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));

  if (!clientList.length) {
    notFound();
  }

  const client = clientList[0];

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.clientId, client.id), eq(invoices.businessId, businessId)))
    .orderBy(desc(invoices.createdAt));

  let totalBilled = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;

  clientInvoices.forEach((inv: typeof invoices.$inferSelect) => {
    totalBilled += parseFloat(inv.total) || 0;
    totalPaid += parseFloat(inv.amountPaid) || 0;
    totalOutstanding += parseFloat(inv.balanceDue) || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{client.name}</h1>
            {client.company && <p className="text-xs text-emerald-400 font-medium">{client.company}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${client.id}/edit`}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Edit3 className="w-4 h-4 text-slate-400" />
            <span>Edit Client</span>
          </Link>
          <Link
            href={`/invoices/new?clientId=${client.id}`}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Contact Information</h2>

          <div className="space-y-3 text-xs">
            {client.email && (
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Notes</span>
              <p className="text-xs text-slate-400 italic">{client.notes}</p>
            </div>
          )}
        </div>


{/* Financial summary stats */}
<div className="md:col-span-2 min-w-0 rounded-2xl border border-slate-800 bg-slate-900">
  <div className="overflow-x-auto overscroll-x-contain p-6">
    <div className="grid min-w-max grid-cols-3 gap-8 md:min-w-0 md:gap-4">
      <div className="min-w-max">
        <span className="block whitespace-nowrap text-xs font-semibold text-slate-400">
          Total Billed
        </span>
        <span className="mt-2 block whitespace-nowrap text-2xl font-extrabold text-white">
          ${formatMoneyDecimal(totalBilled)}
        </span>
      </div>

      <div className="min-w-max">
        <span className="block whitespace-nowrap text-xs font-semibold text-slate-400">
          Total Paid
        </span>
        <span className="mt-2 block whitespace-nowrap text-2xl font-extrabold text-emerald-400">
          ${formatMoneyDecimal(totalPaid)}
        </span>
      </div>

      <div className="min-w-max">
        <span className="block whitespace-nowrap text-xs font-semibold text-slate-400">
          Outstanding
        </span>
        <span
          className={`mt-2 block whitespace-nowrap text-2xl font-extrabold ${
            totalOutstanding > 0
              ? "text-amber-400"
              : "text-slate-300"
          }`}
        >
          ${formatMoneyDecimal(totalOutstanding)}
        </span>
      </div>
    </div>
  </div>
</div>

  </div>
      {/* Invoice History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Invoice History</h2>

        {clientInvoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No invoices issued to this client yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Invoice #</th>
                  <th className="pb-3 px-2">Issue Date</th>
                  <th className="pb-3 px-2">Due Date</th>
                  <th className="pb-3 px-2">Total</th>
                  <th className="pb-3 px-2">Balance Due</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {clientInvoices.map((inv: typeof invoices.$inferSelect) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-mono font-bold text-white">{inv.number}</td>
                    <td className="py-3 px-2 text-slate-400">{inv.issueDate}</td>
                    <td className="py-3 px-2 text-slate-400">{inv.dueDate}</td>
                    <td className="py-3 px-2 font-semibold">{inv.currency} {inv.total}</td>
                    <td className="py-3 px-2 font-semibold text-amber-400">{inv.currency} {inv.balanceDue}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : inv.status === "OVERDUE"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-xs text-emerald-400 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
