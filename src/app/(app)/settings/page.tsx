import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsClientForm from "./SettingsClientForm";
import { getBusinessPlanStatus } from "@/lib/subscriptions/limits";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getCustomerSession();
  if (!session || !session.businessId) {
    redirect("/sign-in");
  }
  const businessId = session.businessId;

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const planStatus = await getBusinessPlanStatus(businessId);

  return <SettingsClientForm business={biz} planStatus={planStatus} />;
}
