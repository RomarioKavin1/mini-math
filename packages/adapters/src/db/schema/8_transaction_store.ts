// db/schema/user_transactions.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  varchar,
  pgEnum,
  numeric,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const txDirectionEnum = pgEnum('tx_direction', ['credit', 'debit'])
export const txSourceEnum = pgEnum('tx_source', ['platform', 'evm'])
export const platformRefKindEnum = pgEnum('platform_ref_kind', [
  'admin_adjustment',
  'reward',
  'purchase',
  'refund',
  'other',
])

export const userTransactions = pgTable(
  'user_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: text('user_id').notNull(),

    idempotencyKey: text('idempotency_key').notNull(),

    direction: txDirectionEnum('direction').notNull(),
    source: txSourceEnum('source').notNull(),

    assetSymbol: text('asset_symbol').notNull(),
    assetDecimals: integer('asset_decimals').notNull(),
    assetAmount: numeric('asset_amount', { precision: 78, scale: 0 }).notNull(),

    memo: text('memo'),

    platformRefKind: platformRefKindEnum('platform_ref_kind'),
    platformRefId: text('platform_ref_id'),

    evmChainId: integer('evm_chain_id'),
    evmTokenAddress: varchar('evm_token_address', { length: 42 }),
    evmTxHash: varchar('evm_tx_hash', { length: 66 }),
    evmLogIndex: integer('evm_log_index'),
    evmFrom: varchar('evm_from', { length: 42 }),
    evmTo: varchar('evm_to', { length: 42 }),
    evmBlockNumber: bigint('evm_block_number', { mode: 'bigint' }),

    meta: jsonb('meta').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_tx_user_id_idempo_uq').on(t.userId, t.idempotencyKey),

    index('user_tx_user_id_created_at_idx').on(t.userId, t.createdAt),

    index('user_tx_source_idx').on(t.source),
    index('user_tx_direction_idx').on(t.direction),

    index('user_tx_asset_idx').on(t.assetSymbol, t.assetDecimals),

    index('user_tx_evm_lookup_idx').on(t.evmChainId, t.evmTokenAddress, t.evmTxHash, t.evmLogIndex),

    uniqueIndex('user_tx_evm_uq')
      .on(t.evmChainId, t.evmTokenAddress, t.evmTxHash, t.evmLogIndex)
      .where(sql`${t.source} = 'evm'`),
  ],
)
