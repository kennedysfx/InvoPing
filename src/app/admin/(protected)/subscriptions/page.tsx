import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import SubscriptionOverrideButton from "./SubscriptionOverrideButton";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin");
  }

  const allBusinesses = await db
    .select({
      business: businesses,
      subscription: subscriptions,
    })
    .from(businesses)
    .leftJoin(subscriptions, eq(businesses.id, subscriptions.businessId))
    .orderBy(desc(businesses.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Subscription Management</h1>
        <p className="text-xs text-slate-400 mt-1">Override business tier entitlements (Free, Starter, Pro)</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4">Business</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Tier</th>
                <th className="py-3.5 px-4 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {allBusinesses.map(({ business, subscription }: { business: typeof businesses.$inferSelect; subscription: typeof subscriptions.$inferSelect | null }) => (
                <tr key={business.id} className="hover:bg-slate-800/40">
                  <td className="py-4 px-4 font-bold text-white">{business.name}</td>
                  <td className="py-4 px-4 text-slate-300">{business.email}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-rose-400 border border-slate-700">
                      {subscription?.plan || "FREE"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <SubscriptionOverrideButton
                      businessId={business.id}
                      currentPlan={subscription?.plan || "FREE"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
