import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { getBusinessPlanStatus } from "@/lib/subscriptions/limits";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/sign-in");
  }

  if (!session.onboardingCompleted || !session.businessId) {
    redirect("/onboarding");
  }

  const bizList = await db.select().from(businesses).where(eq(businesses.id, session.businessId));
  const business = bizList[0];

  const planStatus = await getBusinessPlanStatus(session.businessId);

  const usageText = `${planStatus.currentMonthInvoices} of ${
    planStatus.invoiceLimit === Infinity ? "∞" : planStatus.invoiceLimit
  } invoices used`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      <AppSidebar planName={`${planStatus.plan.name} Plan`} usageText={usageText} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppNavbar
          userEmail={session.email}
          businessName={business?.name}
          currency={business?.currency}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
