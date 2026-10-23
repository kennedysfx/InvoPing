"use server";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import { db } from "@/db";
import { clients, activityLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { assertCanCreateClient } from "@/lib/subscriptions/limits";
import { revalidatePath } from "next/cache";

export interface ClientData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export async function createClientAction(data: ClientData) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Client name is required." };
  }

  // Enforce backend plan limits
  try {
    await assertCanCreateClient(session.businessId);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  const [client] = await db
    .insert(clients)
    .values({
      businessId: session.businessId,
      name: data.name.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .returning();

  await db.insert(activityLogs).values({
    businessId: session.businessId,
    userId: session.userId,
    action: "CREATED_CLIENT",
    details: `Added client ${client.name}`,
  });

  revalidatePath("/clients");
  return { success: true, client };
}

export async function updateClientAction(clientId: string, data: ClientData) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  // Tenant check
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, session.businessId)));

  if (!existing.length) {
    return { success: false, error: "Client not found or unauthorized." };
  }

  const [updated] = await db
    .update(clients)
    .set({
      name: data.name.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId))
    .returning();

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true, client: updated };
}

export async function archiveClientAction(clientId: string) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, session.businessId)));

  if (!existing.length) {
    return { success: false, error: "Client not found or unauthorized." };
  }

  // Soft archive to preserve historical invoices
  await db
    .update(clients)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(clients.id, clientId));

  revalidatePath("/clients");
  return { success: true };
}
