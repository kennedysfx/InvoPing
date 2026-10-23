ALTER TABLE "invoices" ADD COLUMN "reporting_currency" varchar(10);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate" numeric(24, 12);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "converted_total" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate_date" text;