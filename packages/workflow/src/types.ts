import { z } from 'zod'
import { NodeDef, NodeRef } from '@mini-math/nodes'
import { WORKFLOW_CONSTANTS } from '@mini-math/utils'

export const WorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  version: z.string(), // immutable once published
  nodes: z.array(NodeDef).min(1),
  edges: z.array(
    z.object({
      from: NodeRef,
      to: NodeRef,
      condition: z.string().optional(), // expression string
    }),
  ),
  entry: NodeRef, // start node
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
})
