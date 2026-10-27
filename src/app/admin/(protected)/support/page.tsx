
import { desc, eq, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import { db } from "@/db";
import { supportConversations, supportMessages, users } from "@/db/schema";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const admin = await getAdminSession();

  if (!admin) redirect("/admin");
  if (admin.role !== "SUPER_ADMIN") notFound();

  const conversations = await db
    .select({
      id: supportConversations.id,
      customerEmail: users.email,
      status: supportConversations.status,
      updatedAt: supportConversations.updatedAt,
      latestMessage: sql<string | null>`(
        SELECT sm.text
        FROM support_messages sm
        WHERE sm.conversation_id = ${supportConversations.id}
        ORDER BY sm.created_at DESC, sm.id DESC
        LIMIT 1
      )`,
      latestMessageAt: sql<Date | null>`(
        SELECT sm.created_at
        FROM support_messages sm
        WHERE sm.conversation_id = ${supportConversations.id}
        ORDER BY sm.created_at DESC, sm.id DESC
        LIMIT 1
      )`,
    })
    .from(supportConversations)
    .innerJoin(users, eq(supportConversations.customerId, users.id))
    .orderBy(desc(supportConversations.updatedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Support Inbox
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Customer support conversations ({conversations.length})
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {conversations.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No support conversations yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {conversations.map((conversation) => (
              <Link
  key={conversation.id}
  href={`/admin/support/${conversation.id}`}
  className="flex flex-col gap-3 p-5 transition-colors hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {conversation.customerEmail}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {conversation.latestMessage || "No messages yet"}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {conversation.latestMessageAt
                      ? new Date(conversation.latestMessageAt).toLocaleString("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Africa/Lagos",
                        })
                      : "No activity"}
                  </p>
                </div>

                <span className="w-fit shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                  {conversation.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
