
"use server";

import {
  authenticateAdmin,
  logoutAdmin,
  getAdminSession,
} from "@/lib/admin-auth/admin-auth";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface AdminActionResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

// ==========================================
// SUPER ADMIN LOGIN
// ==========================================

export async function adminLoginAction(
  formData: FormData
): Promise<AdminActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return {
      success: false,
      error: "Email and password are required.",
    };
  }

  const result = await authenticateAdmin(email, password);

  if (result.success) {
    return {
      success: true,
      redirectUrl: "/admin/dashboard",
    };
  }

  return {
    success: false,
    error: result.error || "Authentication failed.",
  };
}

// ==========================================
// SUPER ADMIN LOGOUT
// ==========================================

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect("/admin");
}

// ==========================================
// ATOMIC MANUAL SUBSCRIPTION MANAGEMENT
// ==========================================

export async function adminUpdateSubscriptionAction(
  businessId: string,
  newPlan: "FREE" | "STARTER" | "PRO",
  reason: string
): Promise<AdminActionResult> {
  const admin = await getAdminSession();

  if (!admin || admin.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Only the Super Admin can modify subscriptions.",
    };
  }

  if (
    typeof businessId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      businessId
    )
  ) {
    return {
      success: false,
      error: "Invalid business ID.",
    };
  }

  if (
    newPlan !== "FREE" &&
    newPlan !== "STARTER" &&
    newPlan !== "PRO"
  ) {
    return {
      success: false,
      error: "Invalid subscription plan.",
    };
  }

  const cleanReason =
    typeof reason === "string" ? reason.trim() : "";

  if (cleanReason.length < 5 || cleanReason.length > 500) {
    return {
      success: false,
      error: "Enter a reason between 5 and 500 characters.",
    };
  }

  try {
    const now = new Date();
    const nextMonth = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const metadata = {
      reason: cleanReason,
      changedBy: admin.email,
      changedAt: now.toISOString(),
    };

    const result = await db.execute(sql`
      WITH target_business AS MATERIALIZED (
        SELECT id
        FROM businesses
        WHERE id = ${businessId}::uuid
        FOR UPDATE
      ),
      previous_subscription AS MATERIALIZED (
        SELECT
          s.id,
          s.plan
        FROM subscriptions s
        JOIN target_business b
          ON b.id = s.business_id
      ),
      changed_subscription AS (
        INSERT INTO subscriptions (
          business_id,
          plan,
          status,
          current_period_start,
          current_period_end
        )
        SELECT
          b.id,
          ${newPlan},
          'ACTIVE',
          ${now.toISOString()}::timestamp,
          ${nextMonth.toISOString()}::timestamp
        FROM target_business b
        WHERE NOT EXISTS (
          SELECT 1
          FROM previous_subscription
        )
        OR EXISTS (
          SELECT 1
          FROM previous_subscription
          WHERE plan IS DISTINCT FROM ${newPlan}::text
        )
        ON CONFLICT (business_id)
        DO UPDATE SET
          plan = EXCLUDED.plan,
          updated_at = NOW()
        WHERE subscriptions.plan IS DISTINCT FROM EXCLUDED.plan
        RETURNING business_id, plan
      ),
      logged_change AS (
        INSERT INTO admin_activity_logs (
          admin_id,
          action,
          target_type,
          target_id,
          metadata
        )
        SELECT
          ${admin.adminId}::uuid,
          'UPDATE_SUBSCRIPTION',
          'BUSINESS',
          c.business_id::text,
          jsonb_build_object(
            'previousPlan',
            COALESCE(
              (SELECT plan FROM previous_subscription LIMIT 1),
              'FREE'
            ),
            'newPlan',
            c.plan,
            'reason',
${metadata.reason}::text,
'changedBy',
${metadata.changedBy}::text,
'changedAt',
${metadata.changedAt}::text
          )::text
        FROM changed_subscription c
        RETURNING id
      )
      SELECT
        (SELECT COUNT(*) FROM target_business) AS business_count,
        (SELECT COUNT(*) FROM changed_subscription) AS change_count,
        (SELECT COUNT(*) FROM logged_change) AS log_count
    `);

    const counts = result.rows[0] as
      | {
          business_count: string | number;
          change_count: string | number;
          log_count: string | number;
        }
      | undefined;

    if (!counts || Number(counts.business_count) !== 1) {
      return {
        success: false,
        error: "Business not found.",
      };
    }

    if (Number(counts.change_count) === 0) {
      return {
        success: false,
        error: "The business is already on this plan.",
      };
    }

    if (
      Number(counts.change_count) !== 1 ||
      Number(counts.log_count) !== 1
    ) {
      console.error(
        "[ADMIN] Unexpected subscription change counts:",
        counts
      );

      return {
        success: false,
        error: "Subscription change requires verification.",
      };
    }

    revalidatePath("/admin/businesses");
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[ADMIN] Subscription update failed:",
      error
    );

    return {
      success: false,
      error: "Unable to update subscription. Please try again.",
    };
  }
}
