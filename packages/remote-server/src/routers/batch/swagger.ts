import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { BatchSchemas, CommonSchemas } from '../../schemas/index.js'

export const BATCH_JOBS = 'Batch Jobs'

export const basePath = '/batchJobs'

export const createBatch: RouteConfig = {
  method: 'post',
  path: `${basePath}/createBatch`,
  tags: [BATCH_JOBS],
  summary: 'Creates and stored batch jobs',
  description: `Created multiple jobs grouped under a batch id.\n
  Once created you receive a batchId. Using batchId you can query the workflowIds \n
  and use them to fetch the state of the workflow`,
  request: {
    body: {
      content: {
        'application/json': { schema: BatchSchemas.ScheduleBatchRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When batch is successfully created',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [createBatch]
