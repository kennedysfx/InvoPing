"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { earlyAccessSignups } from "@/db/schema";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
});

export interface EarlyAccessResult {
  success: boolean;
  error?: string;
}

async function getVisitorIpHash(): Promise<string | null> {
  const requestHeaders = await headers();

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const realIp = requestHeaders.get("x-real-ip");

  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();

  if (!ip) {
    if (process.env.NODE_ENV !== "production") {
      return createHmac(
        "sha256",
        process.env.EARLY_ACCESS_IP_HASH_SECRET!
      )
        .update("local-development")
        .digest("hex");
    }

    return null;
  }

  const secret = process.env.EARLY_ACCESS_IP_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("EARLY_ACCESS_IP_HASH_SECRET is not configured correctly.");
  }

  return createHmac("sha256", secret).update(ip).digest("hex");
}

async function checkRegistrationRateLimit(ipHash: string): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO early_access_rate_limits (
      ip_hash,
      window_started_at,
      attempt_count,
      blocked_until
    )
    VALUES (
      ${ipHash},
      NOW(),
      1,
      NULL
    )
    ON CONFLICT (ip_hash)
    DO UPDATE SET
      attempt_count = CASE
        WHEN early_access_rate_limits.blocked_until > NOW()
          THEN early_access_rate_limits.attempt_count
        WHEN early_access_rate_limits.window_started_at
          <= NOW() - (${RATE_LIMIT_WINDOW_MINUTES} * INTERVAL '1 minute')
          THEN 1
        ELSE early_access_rate_limits.attempt_count + 1
      END,

      window_started_at = CASE
        WHEN early_access_rate_limits.blocked_until > NOW()
          THEN early_access_rate_limits.window_started_at
        WHEN early_access_rate_limits.window_started_at
          <= NOW() - (${RATE_LIMIT_WINDOW_MINUTES} * INTERVAL '1 minute')
          THEN NOW()
        ELSE early_access_rate_limits.window_started_at
      END,

      blocked_until = CASE
        WHEN early_access_rate_limits.blocked_until > NOW()
          THEN early_access_rate_limits.blocked_until
        WHEN early_access_rate_limits.window_started_at
          <= NOW() - (${RATE_LIMIT_WINDOW_MINUTES} * INTERVAL '1 minute')
          THEN NULL
        WHEN early_access_rate_limits.attempt_count >= ${MAX_ATTEMPTS}
          THEN NOW() + (${RATE_LIMIT_WINDOW_MINUTES} * INTERVAL '1 minute')
        ELSE NULL
      END

    RETURNING blocked_until > NOW() AS is_blocked
  `);

  const row = result.rows[0] as { is_blocked: boolean } | undefined;

  return !row?.is_blocked;
}

export async function registerEarlyAccessAction(
  input: unknown
): Promise<EarlyAccessResult> {
  const validation = registrationSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Please check your details.",
    };
  }

  try {
    const ipHash = await getVisitorIpHash();

    if (!ipHash) {
      return {
        success: false,
        error: "Unable to process your registration right now. Please try again later.",
      };
    }

    const allowed = await checkRegistrationRateLimit(ipHash);

    if (!allowed) {
      return {
        success: false,
        error: "Too many registration attempts. Please try again in 15 minutes.",
      };
    }

    const { name, email } = validation.data;

    await db
      .insert(earlyAccessSignups)
      .values({
        name,
        email: email.toLowerCase(),
      })
      .onConflictDoNothing({
        target: earlyAccessSignups.email,
      });

    // Return the same response for new and existing email addresses.
    return { success: true };
  } catch (error) {
    console.error("Early Access registration failed:", error);

    return {
      success: false,
      error: "We couldn't complete your registration. Please try again.",
    };
  }
}