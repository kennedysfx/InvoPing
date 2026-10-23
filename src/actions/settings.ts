"use server";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface BusinessSettingsPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  paymentInstructions?: string;
  invoicePrefix?: string;
  logoUrl?: string;
}

export async function updateBusinessSettingsAction(data: BusinessSettingsPayload) {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    return { success: false, error: "Unauthorized." };
  }

  await db
    .update(businesses)
    .set({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      currency: data.currency || "USD",
      paymentInstructions: data.paymentInstructions?.trim() || null,
      invoicePrefix: data.invoicePrefix?.trim() || "INV-",
      logoUrl: data.logoUrl?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, session.businessId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
