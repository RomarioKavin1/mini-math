// packages/adapters/src/db/schema/??_workflow_batches.ts
import { pgTable, text, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

/**
 * Stores batch metadata. (No FK on purpose.)
 * Uniqueness: (owner, batch_id)
 */
export const workflowBatches = pgTable(
  'workflow_batches',
  {
    owner: varchar('owner', { length: 128 }).notNull(),
    batchId: varchar('batch_id', { length: 128 }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('workflow_batches_owner_batch_id_uq').on(t.owner, t.batchId),
    index('workflow_batches_owner_idx').on(t.owner),
  ],
)

/**
 * Stores the workflow ids that belong to a batch. (No FK on purpose.)
 * Uniqueness: (owner, batch_id, workflow_id) to prevent duplicates.
 */
export const workflowBatchWorkflows = pgTable(
  'workflow_batch_workflows',
  {
    owner: varchar('owner', { length: 128 }).notNull(),
    batchId: varchar('batch_id', { length: 128 }).notNull(),
    workflowId: text('workflow_id').notNull(), // uuid string or anything else

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerBatchWorkflowUq: uniqueIndex('workflow_batch_workflows_owner_batch_workflow_uq').on(
      t.owner,
      t.batchId,
      t.workflowId,
    ),
    ownerBatchIdx: index('workflow_batch_workflows_owner_batch_idx').on(t.owner, t.batchId),
    workflowIdIdx: index('workflow_batch_workflows_workflow_id_idx').on(t.workflowId),
  }),
)
