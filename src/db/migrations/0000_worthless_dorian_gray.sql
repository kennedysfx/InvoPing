CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'OWNER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"logo_url" text,
	"payment_instructions" text,
	"invoice_prefix" varchar(20) DEFAULT 'INV-' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"number" text NOT NULL,
	"issue_date" text NOT NULL,
	"due_date" text NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"balance_due" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"public_token" text NOT NULL,
	"notes" text,
	"payment_instructions" text,
	"first_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" text NOT NULL,
	"method" text DEFAULT 'Bank Transfer' NOT NULL,
	"reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"reminder_type" text NOT NULL,
	"message" text NOT NULL,
	"initiated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"plan" text DEFAULT 'FREE' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"period_start" text NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"client_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_templates" ADD CONSTRAINT "reminder_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_business_idx" ON "activity_logs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_admin_idx" ON "admin_activity_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "business_members_business_user_idx" ON "business_members" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "clients_business_idx" ON "clients" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_business_idx" ON "invoices" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "invoices_client_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoices_public_token_idx" ON "invoices" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_business_idx" ON "payments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reminder_templates_business_idx" ON "reminder_templates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reminders_invoice_idx" ON "reminders" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "reminders_business_idx" ON "reminders" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "usage_business_period_idx" ON "usage" USING btree ("business_id","period_start");--> statement-breakpoint
CREATE INDEX "verification_codes_email_idx" ON "verification_codes" USING btree ("email");