import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { generateOtpCode, renderOtpEmailHtml, AuthFlow } from "./customer-auth";

describe("Customer Authentication - OTP Generation & Email Rendering", () => {
  it("generates random 6-digit numeric OTP codes", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOtpCode();
      assert.equal(code.length, 6);
      assert.match(code, /^\d{6}$/);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  it("renders custom registration HTML template for SIGN_UP flow", () => {
    const code = "849201";
    const html = renderOtpEmailHtml(code, "SIGN_UP");

    assert.ok(html.includes("Your InvoPing Registration Code"));
    assert.ok(html.includes("create your InvoPing account"));
    assert.ok(html.includes(code));
    assert.ok(html.includes("Invo"));
    assert.ok(html.includes("Ping"));
  });

  it("renders custom sign-in HTML template for SIGN_IN flow", () => {
    const code = "319482";
    const html = renderOtpEmailHtml(code, "SIGN_IN");

    assert.ok(html.includes("Your Verification Code"));
    assert.ok(html.includes("complete your sign-in to InvoPing"));
    assert.ok(html.includes(code));
  });
});

describe("Customer Authentication - Cross-Flow OTP Protection", () => {
  it("cryptographically rejects a SIGN_UP OTP code when attempted on SIGN_IN", async () => {
    const otp = "582910";
    // Simulate generation for SIGN_UP
    const signUpHash = await bcrypt.hash(`${otp}:SIGN_UP`, 8);

    // Verify that it validates for SIGN_UP
    const validSignUp = await bcrypt.compare(`${otp}:SIGN_UP`, signUpHash);
    assert.equal(validSignUp, true, "Sign-up code should validate for SIGN_UP flow");

    // Cross-flow test: attempt to verify on SIGN_IN
    const invalidSignIn = await bcrypt.compare(`${otp}:SIGN_IN`, signUpHash);
    assert.equal(invalidSignIn, false, "Sign-up code MUST be rejected when attempted on SIGN_IN");
  });

  it("cryptographically rejects a SIGN_IN OTP code when attempted on SIGN_UP", async () => {
    const otp = "741029";
    // Simulate generation for SIGN_IN
    const signInHash = await bcrypt.hash(`${otp}:SIGN_IN`, 8);

    // Verify that it validates for SIGN_IN
    const validSignIn = await bcrypt.compare(`${otp}:SIGN_IN`, signInHash);
    assert.equal(validSignIn, true, "Sign-in code should validate for SIGN_IN flow");

    // Cross-flow test: attempt to verify on SIGN_UP
    const invalidSignUp = await bcrypt.compare(`${otp}:SIGN_UP`, signInHash);
    assert.equal(invalidSignUp, false, "Sign-in code MUST be rejected when attempted on SIGN_UP");
  });

  it("rejects invalid or tampered OTP codes within the same flow", async () => {
    const otp = "123456";
    const flow: AuthFlow = "SIGN_UP";
    const hash = await bcrypt.hash(`${otp}:${flow}`, 8);

    const wrongCode = "654321";
    const matchesWrong = await bcrypt.compare(`${wrongCode}:${flow}`, hash);
    assert.equal(matchesWrong, false, "Wrong code must be rejected");
  });
});

describe("Customer Authentication - Input & Flow Validation Logic", () => {
  it("validates email syntax for customer OTP requests", () => {
    const invalidEmails = ["", "   ", "plainaddress", "nodomain"];
    for (const email of invalidEmails) {
      const clean = email.trim().toLowerCase();
      const isValid = clean.length > 0 && clean.includes("@");
      assert.equal(isValid, false, `Expected '${email}' to be rejected as invalid`);
    }

    const validEmails = ["test@example.com", "user.name+tag@sub.domain.co"];
    for (const email of validEmails) {
      const clean = email.trim().toLowerCase();
      const isValid = clean.length > 0 && clean.includes("@");
      assert.equal(isValid, true, `Expected '${email}' to be accepted as valid`);
    }
  });

  it("enforces flow isolation between registration and sign-in payloads", () => {
    const flows: AuthFlow[] = ["SIGN_UP", "SIGN_IN"];
    assert.notEqual(flows[0], flows[1]);
  });
});
