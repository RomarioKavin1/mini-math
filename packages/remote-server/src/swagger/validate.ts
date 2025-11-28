import { WorkflowCore } from '@mini-math/workflow'
import { z } from 'zod'
import type { RouteConfig } from '@asteasolutions/zod-to-openapi'

export const PROD_READY = 'Basic Workflow Operations'
export const ONLY_DEV = 'Only dev environment and for debugging. Do not integrate with UI'

export const StandardResponse = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.any().optional(),
    data: z.any().optional(),
    issues: z.any().optional(),
  })
  .openapi('StandardResponse')

export const ID = z
  .object({
    id: z.string(),
  })
  .openapi('workflowId')

export const validate: RouteConfig = {
  method: 'post',
  tags: [PROD_READY],
  path: '/validate',
  summary: 'Validate Workflow Schema',
  request: {
    body: {
      content: {
        'application/json': { schema: WorkflowCore },
      },
    },
  },
  responses: {
    200: {
      description: 'Workflow is valid',
      content: { 'application/json': { schema: StandardResponse } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
}
