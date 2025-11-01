import { z } from 'zod'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { WorkflowSchema, WorkflowCore } from '@mini-math/workflow'

export const StandardResponse = z
  .object({
    success: z.literal(false),
    message: z.string().optional(),
    error: z.string().optional(),
    data: z.any().optional(),
  })
  .openapi('StandardResponse')

export const ID = z
  .object({
    id: z.string(),
  })
  .openapi('ID')

const registry = new OpenAPIRegistry()

registry.registerPath({
  method: 'post',
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
})

registry.registerPath({
  method: 'post',
  path: '/load',
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
      content: { 'application/json': { schema: ID } },
    },
    400: {
      description: 'error',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/compile',
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
    400: { description: 'Bad Workflow' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/run',
  summary: 'Run the workflow',
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
      content: { 'application/json': { schema: WorkflowSchema } },
    },
    400: { description: 'Validation error' },
    409: {
      description: 'Workflow is already run',
      content: { 'application/json': { schema: StandardResponse } },
    },
    501: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
})

const generator = new OpenApiGeneratorV3(registry.definitions)

export const openapiDoc = generator.generateDocument({
  openapi: '3.0.0',
  info: { title: 'API', version: '1.0.0' },
  servers: [{ url: process.env.SERVER_URL ?? 'http://localhost:3000' }],
})
