import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { invoices, invoiceItems, clients, businesses, payments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceDetailClient from "./InvoiceDetailClient";
import { getBusinessPlanStatus } from "@/lib/subscriptions/limits";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const invoiceRecords = await db
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)));

  if (!invoiceRecords.length) {
    notFound();
  }

  const { invoice, client } = invoiceRecords[0];

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(invoiceItems.sortOrder);

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));

  const invoicePayments = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoice.id))
    .orderBy(desc(payments.createdAt));

  const planStatus = await getBusinessPlanStatus(businessId);

  return (
    <InvoiceDetailClient
      invoice={invoice}
      client={client}
      items={items}
      business={biz}
      payments={invoicePayments}
      planConfig={planStatus.plan}
    />
  );
}
