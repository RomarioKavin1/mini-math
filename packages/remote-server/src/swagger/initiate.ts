import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { ID, StandardResponse } from './validate.js'
import z from 'zod'

export const AFTER_LOADING = 'Requires workflow to be loaded'
export const initiate: RouteConfig = {
  method: 'post',
  path: '/initiate',
  tags: [AFTER_LOADING],
  summary: 'Initiate the workflow in backend. (Does not return the output of any node tough)',
  request: {
    body: {
      content: {
        'application/json': { schema: ID },
      },
    },
  },
  responses: {
    200: {
      description: 'Returns result of workflow initiation',
      content: { 'application/json': { schema: StandardResponse } },
    },
    400: {
      description: 'error',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const ScheduleWorkflowPayload = ID.extend({
  initiateWorkflowInMs: z.number().positive().max(86400),
})

export const schedule: RouteConfig = {
  method: 'post',
  path: '/schedule',
  tags: [AFTER_LOADING],
  summary: 'schedule the workflow in backend. (Does not return the output of any node tough)',
  request: {
    body: {
      content: {
        'application/json': { schema: ScheduleWorkflowPayload },
      },
    },
  },
  responses: {
    200: {
      description: 'Returns result of workflow initiation',
      content: { 'application/json': { schema: StandardResponse } },
    },
    400: {
      description: 'error',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}
