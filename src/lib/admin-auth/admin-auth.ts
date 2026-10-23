
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers, adminLoginAttempts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const ADMIN_COOKIE_NAME = "invoping_admin_session";

const adminJwtSecret = process.env.ADMIN_JWT_SECRET;

if (!adminJwtSecret || adminJwtSecret.length < 32) {
  throw new Error(
    "ADMIN_JWT_SECRET must be configured and contain at least 32 characters."
  );
}

const ADMIN_SECRET_KEY = new TextEncoder().encode(adminJwtSecret);

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;
const LOCKOUT_MINUTES = 10;

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

type LoginAttemptResult = {
  allowed: boolean;
  remainingSeconds: number;
};

// ==========================================
// CHECK LOGIN RATE LIMIT
// ==========================================

async function checkLoginRateLimit(
  email: string
): Promise<LoginAttemptResult> {
  const result = await db.execute(sql`
    SELECT
      GREATEST(
        0,
        CEIL(
          EXTRACT(
            EPOCH FROM (locked_until - NOW())
          )
        )
      ) AS remaining_seconds
    FROM admin_login_attempts
    WHERE email = ${email}
  `);

  const record = result.rows[0];

  const remainingSeconds = Number(
    record?.remaining_seconds ?? 0
  );

  return {
    allowed: remainingSeconds <= 0,
    remainingSeconds,
  };
}

// ==========================================
// RECORD FAILED LOGIN ATTEMPT
// ==========================================

async function recordFailedLogin(email: string) {
  const result = await db.execute(sql`
    INSERT INTO admin_login_attempts (
      email,
      failed_attempts,
      window_started_at,
      locked_until,
      updated_at
    )
    VALUES (
      ${email},
      1,
      NOW(),
      NULL,
      NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
      failed_attempts =
        CASE
          WHEN admin_login_attempts.locked_until > NOW()
            THEN admin_login_attempts.failed_attempts
          WHEN admin_login_attempts.window_started_at IS NULL
            OR admin_login_attempts.window_started_at
               <= NOW() - INTERVAL '10 minutes'
            THEN 1
          ELSE admin_login_attempts.failed_attempts + 1
        END,

      window_started_at =
        CASE
          WHEN admin_login_attempts.locked_until > NOW()
            THEN admin_login_attempts.window_started_at
          WHEN admin_login_attempts.window_started_at IS NULL
            OR admin_login_attempts.window_started_at
               <= NOW() - INTERVAL '10 minutes'
            THEN NOW()
          ELSE admin_login_attempts.window_started_at
        END,

      locked_until =
        CASE
          WHEN admin_login_attempts.locked_until > NOW()
            THEN admin_login_attempts.locked_until
          WHEN (
            CASE
              WHEN admin_login_attempts.window_started_at IS NULL
                OR admin_login_attempts.window_started_at
                   <= NOW() - INTERVAL '10 minutes'
                THEN 1
              ELSE admin_login_attempts.failed_attempts + 1
            END
          ) >= ${MAX_FAILED_ATTEMPTS}
            THEN NOW() + INTERVAL '10 minutes'
          ELSE NULL
        END,

      updated_at = NOW()

    RETURNING failed_attempts, locked_until
  `);

  return result.rows[0];
}

// ==========================================
// RESET FAILED ATTEMPTS
// ==========================================

async function resetFailedLoginAttempts(email: string) {
  await db
    .delete(adminLoginAttempts)
    .where(eq(adminLoginAttempts.email, email));
}

// ==========================================
// AUTHENTICATE SUPER ADMIN
// ==========================================

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{
  success: boolean;
  session?: AdminSessionPayload;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();

  // Check whether the account is locked
  const rateLimit = await checkLoginRateLimit(cleanEmail);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.remainingSeconds / 60);

    return {
      success: false,
      error: `Too many failed login attempts. Please try again in ${minutes} minute(s).`,
    };
  }

  // Find administrator
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, cleanEmail))
    .limit(1);

  // Invalid email
  if (!admin) {
    await recordFailedLogin(cleanEmail);

    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // Deactivated account
  if (!admin.active) {
    return {
      success: false,
      error: "This admin account is deactivated.",
    };
  }

  // Verify password
  const matches = await bcrypt.compare(
    password,
    admin.passwordHash
  );

  if (!matches) {
    await recordFailedLogin(cleanEmail);

    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // Reset failed attempts after successful login
  await resetFailedLoginAttempts(cleanEmail);

  // Update last login timestamp
  await db
    .update(adminUsers)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, admin.id));

  const sessionPayload: AdminSessionPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role as "SUPER_ADMIN" | "ADMIN",
  };

  // Create secure JWT
  const token = await new SignJWT({
    ...sessionPayload,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(ADMIN_SECRET_KEY);

  // Set admin session cookie
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 12 * 60 * 60,
  });

  return {
    success: true,
    session: sessionPayload,
  };
}

// ==========================================
// GET CURRENT ADMIN SESSION
// ==========================================

export async function getAdminSession():
  Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) return null;

    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(
      token,
      ADMIN_SECRET_KEY
    );

    const adminId = payload.adminId;

    if (typeof adminId !== "string") {
      return null;
    }

    // Check current administrator record
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);

    // Reject deleted or deactivated accounts
    if (!admin || !admin.active) {
      return null;
    }

    // Validate current role
    if (
      admin.role !== "SUPER_ADMIN" &&
      admin.role !== "ADMIN"
    ) {
      return null;
    }

    return {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };
  } catch {
    return null;
  }
}

// ==========================================
// ADMIN LOGOUT
// ==========================================

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
