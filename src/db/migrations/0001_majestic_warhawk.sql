DROP INDEX "business_members_business_user_idx";--> statement-breakpoint
DROP INDEX "reminder_templates_business_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "business_members_user_unique_idx" ON "business_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_templates_business_type_unique_idx" ON "reminder_templates" USING btree ("business_id","type");