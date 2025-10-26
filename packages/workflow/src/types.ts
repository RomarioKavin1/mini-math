import { z } from 'zod'
import { NodeDef, NodeDefType, EdgeDef } from '@mini-math/nodes'
import { RuntimeStateSchema } from '@mini-math/runtime'
import { WORKFLOW_CONSTANTS } from '@mini-math/utils'

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(), // immutable once published
  nodes: z.array(NodeDef).min(1),
  edges: z.array(EdgeDef),
  entry: z.string(), // start node
  // global execution policies: May be used latter
  policies: z
    .object({
      defaultTimeoutMs: z.number().int().min(1).default(WORKFLOW_CONSTANTS.DEFAULT_TIMEOUT_MS),
      maxParallel: z.number().int().min(1).default(WORKFLOW_CONSTANTS.MAX_PARALLEL),
    })
    .default({
      defaultTimeoutMs: WORKFLOW_CONSTANTS.DEFAULT_TIMEOUT_MS,
      maxParallel: WORKFLOW_CONSTANTS.MAX_PARALLEL,
    }),

  runtime: RuntimeStateSchema.default({
    queue: [],
    visited: [],
    current: null,
    finished: false,
  }),
})

export type WorkflowDef = z.infer<typeof WorkflowSchema>

export type ClockStatus = 'ok' | 'finished' | 'error'
export interface ClockResult {
  status: ClockStatus
  node?: NodeDefType
  result?: unknown
  code?: string
}
