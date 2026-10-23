
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  users,
  verificationCodes,
  businessMembers,
} from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const CUSTOMER_COOKIE_NAME = "invoping_customer_session";

const jwtSecret = process.env.CUSTOMER_JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    "CUSTOMER_JWT_SECRET must be configured and contain at least 32 characters."
  );
}

const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export type AuthFlow = "SIGN_UP" | "SIGN_IN";

export interface CustomerSessionPayload {
  userId: string;
  email: string;
  businessId?: string;
  onboardingCompleted: boolean;
}

// Render HTML template for OTP emails
export function renderOtpEmailHtml(
  otpCode: string,
  flow: AuthFlow = "SIGN_IN"
): string {
  const isSignUp = flow === "SIGN_UP";

  const headline = isSignUp
    ? "Your InvoPing Registration Code"
    : "Your Verification Code";

  const instructions = isSignUp
    ? "Use the 6-digit code below to create your InvoPing account."
    : "Use the 6-digit code below to complete your sign-in to InvoPing.";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${headline}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 40px 20px;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; text-align: center;">
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #059669; padding: 10px 16px; border-radius: 12px; font-weight: bold; font-size: 20px; color: #ffffff;">
          Invo<span style="color: #34d399;">Ping</span>
        </div>
      </div>

      <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">${headline}</h1>
      <p style="font-size: 14px; color: #94a3b8; margin-top: 0; margin-bottom: 24px;">${instructions}</p>

      <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #34d399;">${otpCode}</span>
      </div>

      <p style="font-size: 12px; color: #64748b; margin: 0;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0 16px 0;" />

      <p style="font-size: 11px; color: #475569; margin: 0;">InvoPing &mdash; Create invoices. Send on WhatsApp. Get paid.</p>
    </div>
  </body>
</html>`;
}

// Generate a random 6-digit verification code
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send customer OTP
export async function sendCustomerOtp(
  email: string,
  flow: AuthFlow = "SIGN_IN"
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return {
      success: false,
      error: "Please provide a valid email address.",
    };
  }

  // Check if account already exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  const userExists = existingUsers.length > 0;

  if (flow === "SIGN_UP" && userExists) {
    return {
      success: false,
      error:
        "An account with this email already exists. Please sign in instead.",
    };
  }

  if (flow === "SIGN_IN" && !userExists) {
    return {
      success: false,
      error:
        "No account found with this email. Please create an account first.",
    };
  }

  const code = generateOtpCode();

  // Hash OTP with authentication flow
  const codeHash = await bcrypt.hash(`${code}:${flow}`, 8);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Insert verification code and capture its unique ID
  const [otpRecord] = await db
    .insert(verificationCodes)
    .values({
      email: cleanEmail,
      codeHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    })
    .returning({ id: verificationCodes.id });

  // Delete only the OTP created by this failed email request
  async function cleanupFailedOtp() {
    try {
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, otpRecord.id));
    } catch (cleanupError) {
      console.error(
        `[AUTH:${flow}] Failed to clean up OTP:`,
        cleanupError
      );
    }
  }

  // Email delivery must succeed before reporting success
  if (!process.env.RESEND_API_KEY) {
    console.error(
      `[AUTH:${flow}] RESEND_API_KEY is not configured.`
    );

    await cleanupFailedOtp();

    return {
      success: false,
      error:
        "Unable to send verification email right now. Please try again later.",
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject =
      flow === "SIGN_UP"
        ? "Your InvoPing Registration Code"
        : "Your InvoPing Verification Code";

    const { data, error } = await resend.emails.send({
      from: "InvoPing <onboarding@resend.dev>",
      to: [cleanEmail],
      subject,
      html: renderOtpEmailHtml(code, flow),
    });

    if (error || !data?.id) {
      console.error(
        `[AUTH:${flow}] Resend email delivery failed:`,
        error?.message || "No email ID returned."
      );

      await cleanupFailedOtp();

      return {
        success: false,
        error:
          "Unable to send verification email right now. Please try again.",
      };
    }

    console.log(
      `[AUTH:${flow}] Verification email accepted by Resend.`
    );
  } catch (resendErr) {
    console.error(
      `[AUTH:${flow}] Exception sending verification email:`,
      resendErr
    );

    await cleanupFailedOtp();

    return {
      success: false,
      error:
        "Unable to send verification email right now. Please try again.",
    };
  }

  // Never expose OTP to browser or server logs
  return { success: true };
}

export async function sendCustomerSignUpOtp(email: string) {
  return sendCustomerOtp(email, "SIGN_UP");
}

export async function sendCustomerSignInOtp(email: string) {
  return sendCustomerOtp(email, "SIGN_IN");
}

// Verify OTP and sign in or create customer account
export async function verifyCustomerOtp(
  email: string,
  code: string,
  flow: AuthFlow = "SIGN_IN"
): Promise<{
  success: boolean;
  session?: CustomerSessionPayload;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  // Find unexpired and unconsumed OTP records
  const records = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, cleanEmail),
        eq(verificationCodes.consumed, false),
        gt(verificationCodes.expiresAt, new Date())
      )
    );

  if (!records.length) {
    return {
      success: false,
      error:
        "Invalid or expired verification code. Please request a new code.",
    };
  }

  const latestRecord = records[records.length - 1];

  if (latestRecord.attempts >= 5) {
    return {
      success: false,
      error: "Too many failed attempts. Please request a new code.",
    };
  }

  // Verify OTP against expected authentication flow
  const matches = await bcrypt.compare(
    `${cleanCode}:${flow}`,
    latestRecord.codeHash
  );

  if (!matches) {
    await db
      .update(verificationCodes)
      .set({ attempts: latestRecord.attempts + 1 })
      .where(eq(verificationCodes.id, latestRecord.id));

    return {
      success: false,
      error: "Incorrect verification code.",
    };
  }

  // Mark OTP as consumed
  await db
    .update(verificationCodes)
    .set({ consumed: true })
    .where(eq(verificationCodes.id, latestRecord.id));

  let user: typeof users.$inferSelect | undefined;

  if (flow === "SIGN_IN") {
    // Sign In authenticates existing accounts only
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    user = userList[0];

    if (!user) {
      return {
        success: false,
        error:
          "No account found with this email. Please create an account first.",
      };
    }
  } else {
    // Sign Up creates an account only after successful OTP verification
    const existingList = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingList.length > 0) {
      return {
        success: false,
        error:
          "An account with this email already exists. Please sign in instead.",
      };
    }

    try {
      const inserted = await db
        .insert(users)
        .values({
          email: cleanEmail,
          onboardingCompleted: false,
        })
        .returning();

      user = inserted[0];
    } catch {
      // Handle concurrent registration attempts
      const recheck = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      if (recheck.length > 0) {
        return {
          success: false,
          error:
            "An account with this email was just created. Please sign in instead.",
        };
      }
    }
  }

  if (!user) {
    return {
      success: false,
      error: "Authentication failed. User record not found.",
    };
  }

  // Find business membership
  let businessId: string | undefined;

  const memberships = await db
    .select()
    .from(businessMembers)
    .where(eq(businessMembers.userId, user.id));

  if (memberships.length > 0) {
    businessId = memberships[0].businessId;
  }

  const sessionPayload: CustomerSessionPayload = {
    userId: user.id,
    email: user.email,
    businessId,
    onboardingCompleted: user.onboardingCompleted,
  };

  // Create JWT session token
  const token = await new SignJWT({ ...sessionPayload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);

  // Set HTTP-only session cookie
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return {
    success: true,
    session: sessionPayload,
  };
}

export async function verifyCustomerSignUpOtp(
  email: string,
  code: string
) {
  return verifyCustomerOtp(email, code, "SIGN_UP");
}

export async function verifyCustomerSignInOtp(
  email: string,
  code: string
) {
  return verifyCustomerOtp(email, code, "SIGN_IN");
}

// Get current authenticated customer session
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, SECRET_KEY);

    return payload as unknown as CustomerSessionPayload;
  } catch {
    return null;
  }
}

// Sign out customer
export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}

// Refresh customer session using current database records
export async function refreshCustomerSession(): Promise<boolean> {
  const session = await getCustomerSession();

  if (!session) {
    return false;
  }

  // Read latest customer details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return false;
  }

  // Read current business membership
  const [membership] = await db
    .select()
    .from(businessMembers)
    .where(eq(businessMembers.userId, user.id))
    .limit(1);

  // Build updated session
  const updatedSession: CustomerSessionPayload = {
    userId: user.id,
    email: user.email,
    businessId: membership?.businessId,
    onboardingCompleted: user.onboardingCompleted,
  };

  // Sign new JWT
  const token = await new SignJWT({ ...updatedSession })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);

  // Replace existing session cookie
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return true;
}
