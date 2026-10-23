import { db } from "@/db";
import { users, businesses, subscriptions, invoices, adminActivityLogs } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { Users, Building2, CreditCard, FileText, Activity, ShieldAlert } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin");
  }

  const [usersCount] = await db.select({ count: count() }).from(users);
  const [bizCount] = await db.select({ count: count() }).from(businesses);
  const [invCount] = await db.select({ count: count() }).from(invoices);

  const subRecords = await db.select().from(subscriptions);

  let freeSubs = 0;
  let starterSubs = 0;
  let proSubs = 0;

  subRecords.forEach((sub: typeof subscriptions.$inferSelect) => {
    if (sub.plan === "STARTER") starterSubs++;
    else if (sub.plan === "PRO") proSubs++;
    else freeSubs++;
  });

  const recentAdminLogs = await db
    .select()
    .from(adminActivityLogs)
    .orderBy(desc(adminActivityLogs.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <span>Welcome Kennedy</span>
          <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
            SUPER_ADMIN
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Platform-wide statistics, business subscriptions, and system activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <Users className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{usersCount?.count || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Registered customers</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Businesses</span>
            <Building2 className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{bizCount?.count || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Configured profiles</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Invoices</span>
            <FileText className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{invCount?.count || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Generated across platform</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Paid Subscriptions</span>
            <CreditCard className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3">{starterSubs + proSubs}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">{starterSubs} Starter • {proSubs} Pro</span>
        </div>
      </div>

      {/* Subscription Tier Breakdown & Recent Admin Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-400" />
            <span>Subscription Plan Distribution</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-white">Free Plan ($0/mo)</span>
              <span className="font-mono font-bold text-slate-400">{freeSubs} businesses</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400">Starter Plan ($5/mo)</span>
              <span className="font-mono font-bold text-emerald-400">{starterSubs} businesses</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-cyan-400">Pro Plan ($10/mo)</span>
              <span className="font-mono font-bold text-cyan-400">{proSubs} businesses</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            <span>Recent Admin Audit Logs</span>
          </h2>

          {recentAdminLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No administrative actions logged yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {recentAdminLogs.map((log: typeof adminActivityLogs.$inferSelect) => (
                <div key={log.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex justify-between">
                  <div>
                    <span className="font-bold text-rose-400 block">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.metadata || log.targetType}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
