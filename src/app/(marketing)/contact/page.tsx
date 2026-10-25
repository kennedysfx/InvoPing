import type { Metadata } from "next";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import SupportPageClient from "@/components/support/support-page-client";
import type { SupportCustomer } from "@/components/support/support-types";

export const metadata: Metadata = {
  title: "Contact Support | InvoPing",
  description:
    "Get help with your InvoPing account, invoices, WhatsApp sharing, payments and subscriptions.",
};

export default async function ContactPage() {
  const session = await getCustomerSession();

  const customer: SupportCustomer | null = session
    ? {
        userId: session.userId,
        email: session.email,
        businessId: session.businessId,
      }
    : null;

  return <SupportPageClient customer={customer} />;
}