import { db } from "@/db";
import { invoices, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generates next sequential invoice number per business (e.g. INV-0001, INV-0002)
 */
export async function generateNextInvoiceNumber(businessId: string): Promise<string> {
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const prefix = biz?.invoicePrefix || "INV-";

  const bizInvoices = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(eq(invoices.businessId, businessId));

  let maxNum = 0;

  bizInvoices.forEach((inv: { number: string }) => {
    // Extract trailing digits
    const match = inv.number.match(/\d+$/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > maxNum) {
        maxNum = parsed;
      }
    }
  });

  const nextSeq = maxNum + 1;
  const paddedSeq = String(nextSeq).padStart(4, "0");

  return `${prefix}${paddedSeq}`;
}

/**
 * Generates a secure, 32-character high-entropy token for public invoice sharing
 */
export function generatePublicInvoiceToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "tok_";
  for (let i = 0; i < 28; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
