
import { db, client } from "../src/db";
import { users, verificationCodes } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  sendCustomerSignUpOtp,
  sendCustomerSignInOtp,
  verifyCustomerSignUpOtp,
  verifyCustomerSignInOtp,
  generateOtpCode,
} from "../src/lib/auth/customer-auth";

async function createTestOtp(
  email: string,
  flow: "SIGN_UP" | "SIGN_IN"
): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(`${code}:${flow}`, 8);

  await db.insert(verificationCodes).values({
    email,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    consumed: false,
  });

  return code;
}

async function runE2eAuthVerification() {
  console.log("Starting Authentication Verification...\n");

  const testEmail = `test_customer_${Date.now()}@example.com`;

  try {
    // 1. Unknown user Sign In rejection
    console.log("1. Testing Sign In with non-existent user...");

    const signInUnknown = await sendCustomerSignInOtp(testEmail);

    if (signInUnknown.success) {
      throw new Error("FAILED: Sign In accepted a non-existent user.");
    }

    if (!signInUnknown.error?.includes("No account found")) {
      throw new Error(
        `FAILED: Unexpected error: ${signInUnknown.error}`
      );
    }

    console.log("PASSED: Unknown user rejected.\n");

    // 2. Sign Up OTP request
    console.log("2. Testing Sign Up OTP request...");

    const signUpReq = await sendCustomerSignUpOtp(testEmail);

    if (!signUpReq.success) {
      throw new Error(
        `FAILED: Sign Up OTP request failed: ${signUpReq.error}`
      );
    }

    if ("codeForDev" in signUpReq) {
      throw new Error("FAILED: OTP exposed in Sign Up response.");
    }

    // Remove request-generated OTPs so the test can use a known code.
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.email, testEmail));

    const signUpCode = await createTestOtp(testEmail, "SIGN_UP");

    console.log("PASSED: Sign Up OTP request succeeded without exposing code.\n");

    // 3. Cross-flow protection
    console.log("3. Testing Sign Up OTP on Sign In flow...");

    const crossFlowSignIn = await verifyCustomerSignInOtp(
      testEmail,
      signUpCode
    );

    if (crossFlowSignIn.success) {
      throw new Error("FAILED: Sign Up OTP accepted on Sign In.");
    }

    console.log("PASSED: Cross-flow attempt rejected.\n");

    // 4. Genuine Sign Up verification
    console.log("4. Testing Sign Up verification...");

    const verifySignUp = await verifyCustomerSignUpOtp(
      testEmail,
      signUpCode
    );

    if (!verifySignUp.success || !verifySignUp.session) {
      throw new Error(
        `FAILED: Sign Up verification failed: ${verifySignUp.error}`
      );
    }

    console.log("PASSED: Account created and session generated.\n");

    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail));

    if (dbUsers.length !== 1) {
      throw new Error("FAILED: User record missing from database.");
    }

    console.log("PASSED: Database user confirmed.\n");

    // 5. Duplicate Sign Up rejection
    console.log("5. Testing duplicate registration...");

    const duplicateSignUp = await sendCustomerSignUpOtp(testEmail);

    if (duplicateSignUp.success) {
      throw new Error("FAILED: Duplicate registration accepted.");
    }

    if (!duplicateSignUp.error?.includes("already exists")) {
      throw new Error(
        `FAILED: Unexpected duplicate error: ${duplicateSignUp.error}`
      );
    }

    console.log("PASSED: Duplicate registration rejected.\n");

    // 6. Sign In OTP request
    console.log("6. Testing Sign In OTP request...");

    const signInReq = await sendCustomerSignInOtp(testEmail);

    if (!signInReq.success) {
      throw new Error(
        `FAILED: Sign In OTP request failed: ${signInReq.error}`
      );
    }

    if ("codeForDev" in signInReq) {
      throw new Error("FAILED: OTP exposed in Sign In response.");
    }

    // Replace the request-generated OTP with a test-controlled OTP.
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.email, testEmail));

    const signInCode = await createTestOtp(testEmail, "SIGN_IN");

    console.log("PASSED: Sign In OTP request succeeded without exposing code.\n");

    // 7. Reverse cross-flow protection
    console.log("7. Testing Sign In OTP on Sign Up flow...");

    const crossFlowSignUp = await verifyCustomerSignUpOtp(
      testEmail,
      signInCode
    );

    if (crossFlowSignUp.success) {
      throw new Error("FAILED: Sign In OTP accepted on Sign Up.");
    }

    console.log("PASSED: Reverse cross-flow attempt rejected.\n");

    // 8. Genuine Sign In verification
    console.log("8. Testing genuine Sign In verification...");

    const verifySignIn = await verifyCustomerSignInOtp(
      testEmail,
      signInCode
    );

    if (!verifySignIn.success || !verifySignIn.session) {
      throw new Error(
        `FAILED: Sign In verification failed: ${verifySignIn.error}`
      );
    }

    console.log("PASSED: Existing user authenticated.\n");

    console.log("All 8 authentication checks passed.");
  } finally {
    // Clean up test data
    console.log("\nCleaning up test records...");

    try {
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      await db
        .delete(users)
        .where(eq(users.email, testEmail));

      console.log("Test records cleaned up.");
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }

    if (client) {
      await client.end();
    }
  }
}

runE2eAuthVerification().catch((error) => {
  console.error("Authentication test failed:", error);
  process.exitCode = 1;
});
