CREATE TABLE "workflow_batch_workflows" (
	"owner" varchar(128) NOT NULL,
	"batch_id" varchar(128) NOT NULL,
	"workflow_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_batches" (
	"owner" varchar(128) NOT NULL,
	"batch_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_batch_workflows_owner_batch_workflow_uq" ON "workflow_batch_workflows" USING btree ("owner","batch_id","workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_batch_workflows_owner_batch_idx" ON "workflow_batch_workflows" USING btree ("owner","batch_id");--> statement-breakpoint
CREATE INDEX "workflow_batch_workflows_workflow_id_idx" ON "workflow_batch_workflows" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_batches_owner_batch_id_uq" ON "workflow_batches" USING btree ("owner","batch_id");--> statement-breakpoint
CREATE INDEX "workflow_batches_owner_idx" ON "workflow_batches" USING btree ("owner");