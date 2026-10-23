CREATE TABLE "admin_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp,
	"locked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_login_attempts_email_unique" UNIQUE("email")
);
