import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { reminders, invoices, clients, reminderTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { BellRing, MessageSquare, Clock, Plus } from "lucide-react";
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/whatsapp/message";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const reminderHistory = await db
    .select({
      reminder: reminders,
      invoiceNumber: invoices.number,
      invoiceId: invoices.id,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(reminders)
    .leftJoin(invoices, eq(reminders.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(reminders.businessId, businessId))
    .orderBy(desc(reminders.createdAt));

  const customTemplates = await db
    .select()
    .from(reminderTemplates)
    .where(eq(reminderTemplates.businessId, businessId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">WhatsApp Reminders</h1>
        <p className="text-xs text-slate-400 mt-1">Template defaults & initiated reminder history for payment follow-ups</p>
      </div>

      {/* Templates Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-emerald-400" />
          <span>Active Reminder Templates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(DEFAULT_REMINDER_TEMPLATES).map(([key, val]) => (
            <div key={key} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{val.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                  {key}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed whitespace-pre-wrap">{val.template}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Initiation History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Initiated Reminder History</span>
        </h2>

        {reminderHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No reminders initiated yet. Send reminders directly from outstanding invoice pages.
          </div>
        ) : (
          <div className="space-y-3">
            {reminderHistory.map(({ reminder, invoiceNumber, invoiceId, clientName }: { reminder: typeof reminders.$inferSelect; invoiceNumber: string | null; invoiceId: string | null; clientName: string | null; clientPhone: string | null }) => (
              <div key={reminder.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{clientName}</span>
                    <span className="text-slate-500">•</span>
                    <Link href={`/invoices/${invoiceId}`} className="text-xs font-mono text-emerald-400 hover:underline">
                      {invoiceNumber}
                    </Link>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      {reminder.reminderType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{reminder.message}</p>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {new Date(reminder.initiatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
