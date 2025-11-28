import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { PROD_READY, StandardResponse } from './validate.js'
import { WorkflowCore } from '@mini-math/workflow'

export const compile: RouteConfig = {
  method: 'post',
  path: '/compile',
  tags: [PROD_READY],
  summary: 'Compile the workflow',
  request: {
    body: {
      content: {
        'application/json': { schema: WorkflowCore },
      },
    },
  },
  responses: {
    200: {
      description: 'Compiles the workflow',
      content: { 'application/json': { schema: StandardResponse } },
    },
    400: {
      description: 'Bad Workflow',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
}
