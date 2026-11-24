CREATE TABLE "early_access_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" text NOT NULL,
	"window_started_at" timestamp DEFAULT now() NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"blocked_until" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "early_access_rate_limits_ip_hash_unique" ON "early_access_rate_limits" USING btree ("ip_hash");