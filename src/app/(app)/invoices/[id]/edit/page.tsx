
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  clients,
  businesses,
} from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import NewInvoiceForm from "../../new/NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getCustomerSession();

  if (!session?.businessId) {
    redirect("/sign-in");
  }

  const businessId = session.businessId;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.businessId, businessId)
      )
    );

  if (!invoice) {
    notFound();
  }

  const [items, clientRecords, businessRecords] =
    await Promise.all([
      db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id))
        .orderBy(invoiceItems.sortOrder),

      db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.businessId, businessId),
            or(
              eq(clients.archived, false),
              eq(clients.id, invoice.clientId)
            )
          )
        ),

      db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId)),
    ]);

  const business = businessRecords[0];

  if (!business) {
    notFound();
  }

  return (
    <NewInvoiceForm
      clients={clientRecords}
      business={business}
      defaultClientId={invoice.clientId}
      existingInvoice={{
        id: invoice.id,
        clientId: invoice.clientId,
        issueDate: String(invoice.issueDate).slice(0, 10),
        dueDate: String(invoice.dueDate).slice(0, 10),
        currency: invoice.currency,
        taxRate: invoice.taxRate,
        discountRate: invoice.discountRate,
        notes: invoice.notes ?? "",
        paymentInstructions:
          invoice.paymentInstructions ?? "",
        amountPaid: invoice.amountPaid,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }}
    />
  );
}
