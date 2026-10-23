ALTER TABLE "payments" ADD COLUMN "currency" varchar(10);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reporting_currency" varchar(10);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "exchange_rate" numeric(24, 12);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "converted_amount" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "exchange_rate_date" text;