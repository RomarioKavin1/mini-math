CREATE TYPE "public"."platform_ref_kind" AS ENUM('admin_adjustment', 'reward', 'purchase', 'refund', 'other');--> statement-breakpoint
CREATE TYPE "public"."tx_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."tx_source" AS ENUM('platform', 'evm');--> statement-breakpoint
CREATE TABLE "user_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"direction" "tx_direction" NOT NULL,
	"source" "tx_source" NOT NULL,
	"asset_symbol" text NOT NULL,
	"asset_decimals" integer NOT NULL,
	"asset_amount" numeric(78, 0) NOT NULL,
	"memo" text,
	"platform_ref_kind" "platform_ref_kind",
	"platform_ref_id" text,
	"evm_chain_id" integer,
	"evm_token_address" varchar(42),
	"evm_tx_hash" varchar(66),
	"evm_log_index" integer,
	"evm_from" varchar(42),
	"evm_to" varchar(42),
	"evm_block_number" bigint,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_tx_user_id_idempo_uq" ON "user_transactions" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "user_tx_user_id_created_at_idx" ON "user_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_tx_source_idx" ON "user_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "user_tx_direction_idx" ON "user_transactions" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "user_tx_asset_idx" ON "user_transactions" USING btree ("asset_symbol","asset_decimals");--> statement-breakpoint
CREATE INDEX "user_tx_evm_lookup_idx" ON "user_transactions" USING btree ("evm_chain_id","evm_token_address","evm_tx_hash","evm_log_index");--> statement-breakpoint
CREATE UNIQUE INDEX "user_tx_evm_uq" ON "user_transactions" USING btree ("evm_chain_id","evm_token_address","evm_tx_hash","evm_log_index") WHERE "user_transactions"."source" = 'evm';