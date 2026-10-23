
"use server";

import {
  sendCustomerSignUpOtp,
  sendCustomerSignInOtp,
  verifyCustomerSignUpOtp,
  verifyCustomerSignInOtp,
  logoutCustomer,
} from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

// Sign Up Flow
export async function requestSignUpOtpAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  return sendCustomerSignUpOtp(email);
}

export async function verifySignUpOtpAction(
  email: string,
  code: string
): Promise<AuthActionResult> {
  if (!email || !code) {
    return {
      success: false,
      error: "Email and verification code are required.",
    };
  }

  const result = await verifyCustomerSignUpOtp(email, code);

  if (result.success && result.session) {
    // New customers always proceed to onboarding
    return { success: true, redirectUrl: "/onboarding" };
  }

  return {
    success: false,
    error: result.error || "Verification failed.",
  };
}

// Sign In Flow
export async function requestSignInOtpAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  return sendCustomerSignInOtp(email);
}

export async function verifySignInOtpAction(
  email: string,
  code: string
): Promise<AuthActionResult> {
  if (!email || !code) {
    return {
      success: false,
      error: "Email and verification code are required.",
    };
  }

  const result = await verifyCustomerSignInOtp(email, code);

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
