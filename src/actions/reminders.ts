"use server";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import { db } from "@/db";
import { reminders, reminderTemplates, activityLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function logReminderInitiatedAction(invoiceId: string, reminderType: string, message: string) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  await db.insert(reminders).values({
    invoiceId,
    businessId: session.businessId,
    reminderType,
    message,
    initiatedAt: new Date(),
  });

  await db.insert(activityLogs).values({
    businessId: session.businessId,
    userId: session.userId,
    action: "SENT_REMINDER",
    details: `Initiated ${reminderType} reminder for invoice`,
  });

  revalidatePath("/reminders");
  return { success: true };
}

export async function updateReminderTemplateAction(templateId: string, name: string, body: string) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  await db
    .update(reminderTemplates)
    .set({
      name: name.trim(),
      body: body.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(reminderTemplates.id, templateId), eq(reminderTemplates.businessId, session.businessId)));

  revalidatePath("/settings");
  revalidatePath("/reminders");
  return { success: true };
}
