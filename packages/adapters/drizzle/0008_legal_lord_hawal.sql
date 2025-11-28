ALTER TABLE "workflows" ALTER COLUMN "next_linked_workflow" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "next_linked_workflow" SET DEFAULT null;