import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Users, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin");
  }

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Registered Users</h1>
        <p className="text-xs text-slate-400 mt-1">Inspect customer registrations and onboarding state</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Onboarding</th>
                <th className="py-3.5 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {allUsers.map((u: typeof users.$inferSelect) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{u.id.substring(0, 8)}...</td>
                  <td className="py-3.5 px-4 font-bold text-white">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-300">{u.name || "—"}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.onboardingCompleted
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {u.onboardingCompleted ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
