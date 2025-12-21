import { WorkflowCore } from '@mini-math/workflow'
import z from 'zod'

export const ScheduleBatchRequestSchema = z.object({
  workflowCore: WorkflowCore,
  schedulesInMs: z.array(z.number().min(10).max(10000000)).min(2).max(100),
})

export type ScheduleBatchRequest = z.infer<typeof ScheduleBatchRequestSchema>
