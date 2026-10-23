import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import NewInvoiceForm from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const clientRecords = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.archived, false)));

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));

  return <NewInvoiceForm clients={clientRecords} defaultClientId={clientId} business={biz} />;
}
