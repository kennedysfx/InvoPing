
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { supportConversations, supportMessages, users } from "@/db/schema";
import { getCustomerSession } from "@/lib/auth/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 5000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SendResult = {
  outcome: "created" | "duplicate" | "conflict" | "rate_limited";
  messageId?: string;
  retryAfter?: number;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticatedCustomer() {
  const session = await getCustomerSession();

  if (!session) return null;

  const [customer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return customer ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const customer = await authenticatedCustomer();

    if (!customer) {
      return errorResponse("Unauthorized", 401);
    }

    const cursor = request.nextUrl.searchParams.get("cursor");

    if (cursor && !UUID_REGEX.test(cursor)) {
      return errorResponse("Invalid pagination cursor", 400);
    }

    const [conversation] = await db
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.customerId, customer.id))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({
        conversation: null,
        messages: [],
        nextCursor: null,
      });
    }

    let cursorCondition;

    if (cursor) {
      const [cursorMessage] = await db
        .select({
          id: supportMessages.id,
          createdAt: supportMessages.createdAt,
        })
        .from(supportMessages)
        .where(
          and(
            eq(supportMessages.id, cursor),
            eq(supportMessages.conversationId, conversation.id),
            gt(supportMessages.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!cursorMessage) {
        return errorResponse("Pagination cursor not found", 400);
      }

      cursorCondition = or(
        lt(supportMessages.createdAt, cursorMessage.createdAt),
        and(
          eq(supportMessages.createdAt, cursorMessage.createdAt),
          lt(supportMessages.id, cursorMessage.id)
        )
      );
    }

    const rows = await db
      .select()
      .from(supportMessages)
      .where(
        and(
          eq(supportMessages.conversationId, conversation.id),
          gt(supportMessages.expiresAt, new Date()),
          cursorCondition
        )
      )
      .orderBy(
        desc(supportMessages.createdAt),
        desc(supportMessages.id)
      )
      .limit(MESSAGE_LIMIT + 1);

    const hasMore = rows.length > MESSAGE_LIMIT;
    const page = rows.slice(0, MESSAGE_LIMIT);

    const nextCursor = hasMore
      ? page[page.length - 1]?.id ?? null
      : null;

    return NextResponse.json({
      conversation,
      messages: page.reverse().map((message) => ({
        ...message,
        attachments: [],
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("[Support GET]", error);
    return errorResponse("Unable to load support messages", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await authenticatedCustomer();

    if (!customer) {
      return errorResponse("Unauthorized", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request", 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("text" in body) ||
      typeof body.text !== "string" ||
      !("clientMessageId" in body) ||
      typeof body.clientMessageId !== "string"
    ) {
      return errorResponse("Invalid message request", 400);
    }

    const text = body.text.trim();
    const clientMessageId = body.clientMessageId;

    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      return errorResponse(
        "Message must contain 1–5000 characters",
        400
      );
    }

    if (!UUID_REGEX.test(clientMessageId)) {
      return errorResponse("Invalid client message ID", 400);
    }

    let [conversation] = await db
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.customerId, customer.id))
      .limit(1);

    if (!conversation) {
      const inserted = await db
        .insert(supportConversations)
        .values({ customerId: customer.id })
        .onConflictDoNothing()
        .returning();

      conversation = inserted[0];

      if (!conversation) {
        [conversation] = await db
          .select()
          .from(supportConversations)
          .where(eq(supportConversations.customerId, customer.id))
          .limit(1);
      }
    }

    if (!conversation) {
      throw new Error("Unable to create support conversation");
    }

    const result = await db.execute(sql`
      SELECT public.send_customer_support_message(
        ${customer.id}::uuid,
        ${conversation.id}::uuid,
        ${clientMessageId}::uuid,
        ${text}::text
      ) AS result
    `);

    const outcome = result.rows[0]?.result as SendResult | undefined;

    if (!outcome) {
      throw new Error("Missing database send result");
    }

    if (outcome.outcome === "conflict") {
      return errorResponse(
        "Client message ID was already used for different content",
        409
      );
    }

    if (outcome.outcome === "rate_limited") {
      const retryAfter = Math.max(1, outcome.retryAfter ?? 60);

      return NextResponse.json(
        {
          error: "You have reached the limit of 10 messages per minute. Please wait before sending another message.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    if (!outcome.messageId) {
      throw new Error("Missing saved message ID");
    }

    const [message] = await db
      .select()
      .from(supportMessages)
      .where(
        and(
          eq(supportMessages.id, outcome.messageId),
          eq(supportMessages.conversationId, conversation.id)
        )
      )
      .limit(1);

    if (!message) {
      throw new Error("Saved support message not found");
    }

    return NextResponse.json(
      {
        message: {
          ...message,
          attachments: [],
        },
      },
      {
        status: outcome.outcome === "duplicate" ? 200 : 201,
      }
    );
  } catch (error) {
    console.error("[Support POST]", error);
    return errorResponse("Unable to send support message", 500);
  }
}
