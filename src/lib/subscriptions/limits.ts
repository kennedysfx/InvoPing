import { db } from "@/db";
import { subscriptions, invoices, clients } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import { getPlanConfig, PlanConfig } from "@/config/plans";

export interface BusinessLimitStatus {
  plan: PlanConfig;
  currentMonthInvoices: number;
  invoiceLimit: number;
  canCreateInvoice: boolean;
  activeClients: number;
  clientLimit: number;
  canCreateClient: boolean;
}

/**
 * Checks current plan usage and limits for a business
 */
export async function getBusinessPlanStatus(businessId: string): Promise<BusinessLimitStatus> {
  // Fetch active subscription
  const subList = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, businessId));

  const planTier = subList.length ? subList[0].plan : "FREE";
  const planConfig = getPlanConfig(planTier);

  // Count invoices created this current calendar month
  const now = new Date();
  const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const allBizInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.businessId, businessId));

  const currentMonthInvoices = allBizInvoices.filter((inv: typeof invoices.$inferSelect) => {
    return inv.issueDate >= startOfMonthStr;
  }).length;

  // Count active (non-archived) clients
  const activeClientsList = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.archived, false)));

  const activeClients = activeClientsList.length;

  return {
    plan: planConfig,
    currentMonthInvoices,
    invoiceLimit: planConfig.monthlyInvoiceLimit,
    canCreateInvoice: currentMonthInvoices < planConfig.monthlyInvoiceLimit,
    activeClients,
    clientLimit: planConfig.maxClients,
    canCreateClient: activeClients < planConfig.maxClients,
  };
}

/**
 * Verifies if a business can create a new invoice based on plan limits
 */
export async function assertCanCreateInvoice(businessId: string): Promise<void> {
  const status = await getBusinessPlanStatus(businessId);
  if (!status.canCreateInvoice) {
    throw new Error(
      `Plan limit reached: You have created ${status.currentMonthInvoices} of ${status.invoiceLimit} allowed invoices this month on the ${status.plan.name} plan. Please upgrade to create more invoices.`
    );
  }
}

/**
 * Verifies if a business can add a new client based on plan limits
 */
export async function assertCanCreateClient(businessId: string): Promise<void> {
  const status = await getBusinessPlanStatus(businessId);
  if (!status.canCreateClient) {
    throw new Error(
      `Plan limit reached: You have ${status.activeClients} active clients of ${status.clientLimit} allowed on the ${status.plan.name} plan. Please upgrade to add more clients.`
    );
  }
}
