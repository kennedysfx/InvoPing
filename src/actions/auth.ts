
"use server";

import { sendCustomerSignInOtp, verifyCustomerSignInOtp, logoutCustomer } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  code?: "EARLY_ACCESS_REQUIRED";
}

function getDeveloperEmail(): string | null {
  const email = process.env.INVOPING_DEVELOPER_EMAIL?.trim().toLowerCase();
  return email || null;
}

function isDeveloperEmail(email: string): boolean {
  const developerEmail = getDeveloperEmail();
  return Boolean(developerEmail && email.trim().toLowerCase() === developerEmail);
}

function getDeveloperConfigError(): string {
  return "Customer login is temporarily unavailable. Please contact the administrator.";
}

// Sign Up Flow — disabled during Early Access
export async function requestSignUpOtpAction(
  _formData: FormData
): Promise<AuthActionResult> {
  return {
    success: false,
    code: "EARLY_ACCESS_REQUIRED",
  };
}

export async function verifySignUpOtpAction(
  _email: string,
  _code: string
): Promise<AuthActionResult> {
  return {
    success: false,
    code: "EARLY_ACCESS_REQUIRED",
  };
}

// Sign In Flow — only the designated developer account can sign in
export async function requestSignInOtpAction(
  formData: FormData
): Promise<AuthActionResult> {
  const emailValue = formData.get("email");

  if (typeof emailValue !== "string" || !emailValue.trim()) {
    return { success: false, error: "Email is required." };
  }

  const email = emailValue.trim().toLowerCase();

  if (!getDeveloperEmail()) {
    console.error("INVOPING_DEVELOPER_EMAIL is not configured.");
    return { success: false, error: getDeveloperConfigError() };
  }

  if (!isDeveloperEmail(email)) {
    return {
      success: false,
      code: "EARLY_ACCESS_REQUIRED",
    };
  }

  return sendCustomerSignInOtp(email);
}

export async function verifySignInOtpAction(
  email: string,
  code: string
): Promise<AuthActionResult> {
  if (
  typeof email !== "string" ||
  typeof code !== "string" ||
  !email.trim() ||
  !code.trim()
) {
    return {
      success: false,
      error: "Email and verification code are required.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!getDeveloperEmail()) {
    console.error("INVOPING_DEVELOPER_EMAIL is not configured.");
    return { success: false, error: getDeveloperConfigError() };
  }

  if (!isDeveloperEmail(normalizedEmail)) {
    return {
      success: false,
      code: "EARLY_ACCESS_REQUIRED",
    };
  }

  const result = await verifyCustomerSignInOtp(normalizedEmail, code);

  if (result.success && result.session) {
    if (!result.session.onboardingCompleted || !result.session.businessId) {
      return { success: true, redirectUrl: "/onboarding" };
    }

    return { success: true, redirectUrl: "/dashboard" };
  }

  return {
    success: false,
    error: result.error || "Verification failed.",
  };
}

// Backward-compatible aliases for existing references
export const requestOtpAction = requestSignInOtpAction;
export const verifyOtpAction = verifySignInOtpAction;

export async function logoutCustomerAction() {
  await logoutCustomer();
  redirect("/sign-in");
}
