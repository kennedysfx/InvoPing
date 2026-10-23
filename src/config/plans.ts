export type PlanTier = "FREE" | "STARTER" | "PRO";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number; // in USD
  monthlyInvoiceLimit: number; // Infinity for unlimited
  maxClients: number; // Infinity for unlimited
  features: {
    customLogo: boolean;
    removeBranding: boolean;
    customTemplates: boolean;
    advancedAnalytics: boolean;
    dataExport: boolean;
  };
  description: string;
  badgeText?: string;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    monthlyInvoiceLimit: 5,
    maxClients: 5,
    features: {
      customLogo: false,
      removeBranding: false,
      customTemplates: false,
      advancedAnalytics: false,
      dataExport: false,
    },
    description: "Perfect for getting started with simple invoicing via WhatsApp.",
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 5,
    monthlyInvoiceLimit: 30,
    maxClients: 50,
    features: {
      customLogo: true,
      removeBranding: true,
      customTemplates: true,
      advancedAnalytics: false,
      dataExport: false,
    },
    description: "Ideal for active freelancers and small service businesses.",
    badgeText: "Most Popular",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 10,
    monthlyInvoiceLimit: Infinity,
    maxClients: Infinity,
    features: {
      customLogo: true,
      removeBranding: true,
      customTemplates: true,
      advancedAnalytics: true,
      dataExport: true,
    },
    description: "For growing agencies and high-volume businesses.",
  },
};

export function getPlanConfig(tier: string | null | undefined): PlanConfig {
  const normalized = (tier?.toUpperCase() || "FREE") as PlanTier;
  return PLANS[normalized] || PLANS.FREE;
}
