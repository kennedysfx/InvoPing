
"use server";

import { randomUUID } from "node:crypto";
import {
  getCustomerSession,
  refreshCustomerSession,
} from "@/lib/auth/customer-auth";
import { db } from "@/db";
import {
  businessMembers,
  users,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface OnboardingData {
  businessName: string;
  businessEmail: string;
  phone?: string;
  address?: string;
  currency: string;
  paymentInstructions?: string;
}

export async function completeOnboardingAction(data: OnboardingData) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized. Please sign in.",
      };
    }

    // Check for an existing business membership.
    const [existingMembership] = await db
      .select()
      .from(businessMembers)
      .where(eq(businessMembers.userId, session.userId))
      .limit(1);

    if (existingMembership) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (!existingUser) {
        return {
          success: false,
          error: "Customer account not found.",
        };
      }

      if (!existingUser.onboardingCompleted) {
        return {
          success: false,
          error:
            "An existing business has an incomplete setup. Please contact support.",
        };
      }

      const refreshed = await refreshCustomerSession();

      if (!refreshed) {
        return {
          success: false,
          error:
            "Unable to refresh your session. Please sign in again.",
        };
      }

      revalidatePath("/dashboard");

      return {
        success: true,
        redirectUrl: "/dashboard",
      };
    }

    // Validate new business details.
    const businessName = data.businessName?.trim();
    const businessEmail = data.businessEmail?.trim().toLowerCase();

    if (!businessName || !businessEmail) {
      return {
        success: false,
        error: "Business name and email are required.",
      };
    }

    const businessId = randomUUID();
    const now = new Date();

    const nextMonth = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const templates = [
      {
        type: "friendly",
        name: "Friendly Reminder",
        body:
          "Hi {client_name}, just a friendly reminder that invoice {invoice_number} for {currency} {balance} is due on {due_date}. View: {public_url}",
      },
      {
        type: "due_today",
        name: "Due Today",
        body:
          "Hi {client_name}, invoice {invoice_number} for {currency} {balance} is due today ({due_date}). View: {public_url}",
      },
      {
        type: "overdue",
        name: "Overdue Notice",
        body:
          "Hi {client_name}, invoice {invoice_number} for {currency} {balance} was due on {due_date}. View: {public_url}",
      },
      {
        type: "final",
        name: "Final Reminder",
        body:
          "FINAL NOTICE: Invoice {invoice_number} for {currency} {balance} is overdue. View link: {public_url}",
      },
    ];

    // A single PostgreSQL statement is atomic.
    // Each dependent CTE reads the previous CTE's result.
    // A failure rolls back all changes made by this statement.
    const result = await db.execute(sql`
      WITH created_business AS (
        INSERT INTO businesses (
          id,
          name,
          email,
          phone,
          address,
          currency,
          payment_instructions
        )
        VALUES (
          ${businessId}::uuid,
          ${businessName},
          ${businessEmail},
          ${data.phone?.trim() || null},
          ${data.address?.trim() || null},
          ${data.currency || "USD"},
          ${data.paymentInstructions?.trim() || null}
        )
        RETURNING id
      ),

      created_membership AS (
        INSERT INTO business_members (
          business_id,
          user_id,
          role
        )
        SELECT
          id,
          ${session.userId}::uuid,
          'OWNER'
        FROM created_business
        RETURNING business_id
      ),

      created_subscription AS (
        INSERT INTO subscriptions (
          business_id,
          plan,
          status,
          current_period_start,
          current_period_end
        )
        SELECT
          business_id,
          'FREE',
          'ACTIVE',
          ${now.toISOString()}::timestamp,
          ${nextMonth.toISOString()}::timestamp
        FROM created_membership
        RETURNING business_id
      ),

      created_templates AS (
        INSERT INTO reminder_templates (
          business_id,
          type,
          name,
          body
        )
        SELECT
          s.business_id,
          t.type,
          t.name,
          t.body
        FROM created_subscription s
        CROSS JOIN (
          VALUES
            (
              ${templates[0].type},
              ${templates[0].name},
              ${templates[0].body}
            ),
            (
              ${templates[1].type},
              ${templates[1].name},
              ${templates[1].body}
            ),
            (
              ${templates[2].type},
              ${templates[2].name},
              ${templates[2].body}
            ),
            (
              ${templates[3].type},
              ${templates[3].name},
              ${templates[3].body}
            )
        ) AS t(type, name, body)
        RETURNING business_id
      ),

      completed_onboarding AS (
        UPDATE users
        SET
          onboarding_completed = TRUE,
          updated_at = NOW()
WHERE id = ${session.userId}::uuid
  AND (SELECT COUNT(*) FROM created_business) = 1
  AND (SELECT COUNT(*) FROM created_membership) = 1
  AND (SELECT COUNT(*) FROM created_subscription) = 1
  AND (SELECT COUNT(*) FROM created_templates) = 4
        RETURNING id
      )

      SELECT
        (SELECT COUNT(*) FROM created_business) AS business_count,
        (SELECT COUNT(*) FROM created_membership) AS membership_count,
        (SELECT COUNT(*) FROM created_subscription) AS subscription_count,
        (SELECT COUNT(*) FROM created_templates) AS template_count,
        (SELECT COUNT(*) FROM completed_onboarding) AS completed_count
    `);

    const counts = result.rows[0] as
      | {
          business_count: string | number;
          membership_count: string | number;
          subscription_count: string | number;
          template_count: string | number;
          completed_count: string | number;
        }
      | undefined;

    if (
      !counts ||
      Number(counts.business_count) !== 1 ||
      Number(counts.membership_count) !== 1 ||
      Number(counts.subscription_count) !== 1 ||
      Number(counts.template_count) !== 4 ||
      Number(counts.completed_count) !== 1
    ) {
      console.error(
        "[ONBOARDING] Unexpected setup counts:",
        counts
      );

      return {
        success: false,
        error:
          "Onboarding records require verification. Please contact support before retrying.",
      };
    }

    // Refresh the JWT after database writes succeed.
    const refreshed = await refreshCustomerSession();

    if (!refreshed) {
      return {
        success: false,
        error:
          "Business created successfully, but session refresh failed. Please sign in again.",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      redirectUrl: "/dashboard",
    };
  } catch (error) {
    console.error("[ONBOARDING] Setup failed:", error);

    return {
      success: false,
      error:
        "Unable to complete onboarding. Please try again or sign in again if setup already completed.",
    };
  }
}
