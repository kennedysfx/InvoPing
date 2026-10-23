import { db } from "@/db";
import { adminActivityLogs, adminUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Activity } from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin");
  }

  const logs = await db
    .select({
      log: adminActivityLogs,
      adminEmail: adminUsers.email,
    })
    .from(adminActivityLogs)
    .leftJoin(adminUsers, eq(adminActivityLogs.adminId, adminUsers.id))
    .orderBy(desc(adminActivityLogs.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Platform Audit Activity</h1>
        <p className="text-xs text-slate-400 mt-1">Audit log of all sensitive platform administration actions</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
          No administrative activity logged yet.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Type</th>
                  <th className="py-3.5 px-4">Target ID</th>
                  <th className="py-3.5 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                {logs.map(({ log, adminEmail }: { log: typeof adminActivityLogs.$inferSelect; adminEmail: string | null }) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-white font-sans">{adminEmail || "Admin"}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-400">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.targetType || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">{log.targetId ? `${log.targetId.substring(0, 8)}...` : "—"}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{log.metadata || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
