import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Users, Search, Phone, Mail, FileText, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsListPage() {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const clientRecords = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.archived, false)))
    .orderBy(desc(clients.createdAt));

  // Calculate invoice counts & outstanding per client
  const allBizInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.businessId, businessId));

  const clientStats: Record<string, { count: number; outstanding: number }> = {};
  allBizInvoices.forEach((inv: typeof invoices.$inferSelect) => {
    if (!clientStats[inv.clientId]) {
      clientStats[inv.clientId] = { count: 0, outstanding: 0 };
    }
    clientStats[inv.clientId].count += 1;
    clientStats[inv.clientId].outstanding += parseFloat(inv.balanceDue) || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Clients</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your clients and view their billing history</p>
        </div>

        <Link
          href="/clients/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </Link>
      </div>

      {clientRecords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No clients added yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your first client to start creating invoices and sending payment links over WhatsApp.
          </p>
          <Link
            href="/clients/new"
            className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add First Client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientRecords.map((client: typeof clients.$inferSelect) => {
            const stats = clientStats[client.id] || { count: 0, outstanding: 0 };
            return (
              <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{client.name}</h3>
                      {client.company && <p className="text-xs text-emerald-400 font-medium">{client.company}</p>}
                    </div>
                    <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                      {stats.count} {stats.count === 1 ? "invoice" : "invoices"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Outstanding</span>
                    <span className={`text-sm font-extrabold ${stats.outstanding > 0 ? "text-amber-400" : "text-slate-300"}`}>
                      ${stats.outstanding.toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
