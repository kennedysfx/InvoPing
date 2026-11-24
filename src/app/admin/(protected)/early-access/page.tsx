
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { db } from "@/db";
import { earlyAccessSignups } from "@/db/schema";
import { Users, UserPlus, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EarlyAccessPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  if (admin.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  const signups = await db
    .select()
    .from(earlyAccessSignups)
    .orderBy(desc(earlyAccessSignups.createdAt));

  const totalSignups = signups.length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <UserPlus className="w-4 h-4" />
          Platform Management
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Early Access Registrations
        </h1>

        <p className="text-sm text-slate-400 mt-2">
          View people who have registered for InvoPing Early Access.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Total Registrations
            </p>
            <p className="text-3xl font-bold text-white mt-2 tabular-nums">
              {totalSignups}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-rose-400" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">
            Registration List
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All Early Access registrations, newest first.
          </p>
        </div>

        {signups.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">
              No registrations yet
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              New Early Access registrations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Full Name</th>
                  <th className="px-5 py-4 font-semibold">Email Address</th>
                  <th className="px-5 py-4 font-semibold whitespace-nowrap">
                    Signup Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {signups.map((signup) => (
                  <tr
                    key={signup.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-200 font-medium">
                      {signup.name}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {signup.email}
                    </td>

                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(signup.createdAt).toLocaleDateString(
                          "en-NG",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
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
