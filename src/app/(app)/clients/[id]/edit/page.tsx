import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditClientForm from "./EditClientForm";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const clientList = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));

  if (!clientList.length) {
    notFound();
  }

  const client = clientList[0];

  return <EditClientForm client={client} />;
}
