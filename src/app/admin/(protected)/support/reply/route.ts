import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supportConversations, supportMessages } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("conversationId" in body) ||
      !("text" in body) ||
      typeof body.conversationId !== "string" ||
      typeof body.text !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const conversationId = body.conversationId;
    const text = body.text.trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId) ||
      text.length < 1 ||
      text.length > 5000
    ) {
      return NextResponse.json(
        { error: "Invalid conversation or message." },
        { status: 400 }
      );
    }

    const [conversation] = await db
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const [message] = await db
      .insert(supportMessages)
      .values({
        conversationId,
        sender: "SUPPORT",
        adminId: admin.adminId,
        text,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[Admin support reply]", error);

    return NextResponse.json(
      { error: "Unable to send reply." },
      { status: 500 }
    );
  }
}