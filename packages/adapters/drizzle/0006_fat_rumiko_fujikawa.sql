ALTER TABLE "workflows" ADD COLUMN "trace" jsonb DEFAULT null;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "is_terminated" boolean DEFAULT false NOT NULL;