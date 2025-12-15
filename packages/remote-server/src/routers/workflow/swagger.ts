import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { ExpectingInputFor, WorkflowCore, WorkflowSchema } from '@mini-math/workflow'
import {
  AFTER_LOADING,
  CommonSchemas,
  CRON,
  EXECUTION,
  VALIDATE,
  WORKFLOW,
} from '../../schemas/index.js'
import z from 'zod'

export const validate: RouteConfig = {
  method: 'post',
  tags: [VALIDATE],
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
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
  },
}

export const compile: RouteConfig = {
  method: 'post',
  path: '/compile',
  tags: [VALIDATE],
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
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Bad Workflow',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
  },
}

export const cron: RouteConfig = {
  method: 'post',
  path: '/cron',
  tags: [CRON],
  summary: 'Load a job with cron like execution',
  request: {
    body: {
      content: {
        'application/json': { schema: CommonSchemas.CronedWorkflowCoreSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When Cron job is successfully loaded',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    404: {
      description: 'When Cron job is failed',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const initiate: RouteConfig = {
  method: 'post',
  path: '/initiate',
  tags: [AFTER_LOADING],
  summary: 'Initiate the workflow in backend. (Does not return the output of any node tough)',
  request: {
    body: {
      content: {
        'application/json': { schema: CommonSchemas.ID },
      },
    },
  },
  responses: {
    200: {
      description: 'Returns result of workflow initiation',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error / If workflow is linked with previous workflow',
      content: {
        'application/json': {
          schema: CommonSchemas.ValidationError.or(CommonSchemas.StandardResponse),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({ status: z.literal(false) }),
        },
      },
    },
    409: {
      description: 'Workflow is already initialized/finished',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({ status: z.literal(false) }),
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const schedule: RouteConfig = {
  method: 'post',
  path: '/schedule',
  tags: [AFTER_LOADING],
  summary: 'schedule the workflow in backend. (Does not return the output of any node tough)',
  request: {
    body: {
      content: {
        'application/json': { schema: CommonSchemas.ScheduleWorkflowPayload },
      },
    },
  },
  responses: {
    200: {
      description: 'Returns result of workflow initiation',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error / prev linked to some other workflow',
      content: {
        'application/json': {
          schema: CommonSchemas.ValidationError.or(CommonSchemas.StandardResponse),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({ status: z.literal(false) }),
        },
      },
    },
    409: {
      description: 'Already in Progress ? Finished',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({ status: z.literal(false) }),
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const load: RouteConfig = {
  method: 'post',
  path: '/load',
  tags: [EXECUTION],
  summary: 'Load Workflow Schema into engine',
  request: {
    body: {
      content: {
        'application/json': { schema: WorkflowCore },
      },
    },
  },
  responses: {
    201: {
      description: 'If the workflow is valid, it will return workflow ID.',
      content: { 'application/json': { schema: CommonSchemas.ID } },
    },
    400: {
      description: 'Validator Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const fetch: RouteConfig = {
  method: 'post',
  path: '/fetch',
  tags: [WORKFLOW],
  summary: 'Fetch the state of workflow',
  request: {
    body: {
      content: {
        'application/json': { schema: CommonSchemas.ID },
      },
    },
  },
  responses: {
    200: {
      description: 'Returns workflow status when finished',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().describe('Value will be `finished`'),
            result: WorkflowSchema,
          }),
        },
      },
    },
    206: {
      description: 'Returns result of partial workflow',
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['inProgress', 'initiated', 'awaitingInput', 'idle']),
            expectingInputFor: ExpectingInputFor.optional(),
          }),
        },
      },
    },
    400: {
      description: 'Validator Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const externalInput: RouteConfig = {
  method: 'post',
  path: '/externalInput',
  tags: [WORKFLOW],
  summary: 'Send External Input to Workflow',
  request: {
    body: {
      content: {
        'application/json': { schema: CommonSchemas.ExternalInputSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When external input is successfully accepted',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({ data: WorkflowCore }),
        },
      },
    },
    400: {
      description: 'Validator Error / Wrong Input Expected',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    409: {
      description: 'Workflow Finished',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [
  compile,
  cron,
  validate,
  schedule,
  initiate,
  load,
  externalInput,
  fetch,
]
