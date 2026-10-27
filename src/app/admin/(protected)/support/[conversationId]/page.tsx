
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { db } from "@/db";
import { supportConversations, supportMessages, users } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";
import AdminReplyForm from "@/components/support/admin-reply-form";

export const dynamic = "force-dynamic";

export default async function AdminSupportConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const admin = await getAdminSession();

  if (!admin) redirect("/admin");
  if (admin.role !== "SUPER_ADMIN") notFound();

  const { conversationId } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      conversationId
    )
  ) {
    notFound();
  }

  const [conversation] = await db
    .select({
      id: supportConversations.id,
      status: supportConversations.status,
      customerEmail: users.email,
      customerName: users.name,
    })
    .from(supportConversations)
    .innerJoin(users, eq(supportConversations.customerId, users.id))
    .where(eq(supportConversations.id, conversationId))
    .limit(1);

  if (!conversation) notFound();

  const messages = await db
    .select({
      id: supportMessages.id,
      sender: supportMessages.sender,
      text: supportMessages.text,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessages)
    .where(eq(supportMessages.conversationId, conversationId))
    .orderBy(asc(supportMessages.createdAt), asc(supportMessages.id));

  const customerName =
    conversation.customerName?.trim() || conversation.customerEmail;

  return (
    <div className="flex h-[calc(100dvh-2rem)] min-h-0 flex-col gap-3 overflow-hidden md:h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-4rem)]">
      <Link
        href="/admin/support"
        className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to Support Inbox
      </Link>

      {/* One unified chat interface */}
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-[#26353d] bg-[#0b141a] shadow-xl">

        {/* Chat header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[#34434b]/50 bg-[#202c33] px-4 py-3 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#374b55] text-[#d1d7db]">
            <UserRound size={23} />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-[#e9edef] sm:text-base">
              {customerName}
            </h1>

            <p className="mt-0.5 truncate text-xs text-[#aebac1]">
              {conversation.customerEmail}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-[#2a3942] px-3 py-1 text-[10px] font-semibold text-[#b7d8c8]">
            {conversation.status}
          </span>
        </header>

        {/* Scrollable messages only */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#0b141a] px-3 py-5 sm:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[#aebac1]">
                No messages yet.
              </p>
            </div>
          ) : (
            <div className="flex min-h-full flex-col justify-end gap-2">
              {messages.map((message) => {
                const fromSupport = message.sender === "SUPPORT";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      fromSupport ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`w-fit max-w-[88%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[65%] ${
                        fromSupport
                          ? "rounded-tr-none bg-[#005c4b] text-[#e9edef]"
                          : "rounded-tl-none bg-[#202c33] text-[#e9edef]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-5 sm:text-sm">
                        {message.text}
                      </p>

                      <p className="mt-1 text-right text-[10px] text-[#aebac1]">
                        {new Date(message.createdAt).toLocaleTimeString(
                          "en-NG",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Africa/Lagos",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer on the same chat layer */}
        <AdminReplyForm conversationId={conversationId} />
      </section>
    </div>
  );
}
