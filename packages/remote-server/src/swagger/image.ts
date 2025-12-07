import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { StandardResponse } from './validate.js'
import { z } from 'zod'
import { WorkflowCore } from '@mini-math/workflow'
import { ListOptionsSchema } from '@mini-math/utils'

export const WorkflowNameSchema = z.object({
  workflowName: z.string().max(16),
})
export type WorkflowNameSchemaType = z.infer<typeof WorkflowNameSchema>

export const StoreWorkflowImageSchema = WorkflowNameSchema.extend({ core: WorkflowCore })
export type StoreWorkflowImageSchemaType = z.infer<typeof StoreWorkflowImageSchema>

export const IMAGE = 'IMAGE'
export const storeImage: RouteConfig = {
  method: 'post',
  path: '/storeImage',
  tags: [IMAGE],
  summary: 'Store Image',
  request: {
    body: {
      content: {
        'application/json': { schema: StoreWorkflowImageSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When Image is stored successfully',
      content: { 'application/json': { schema: StandardResponse } },
    },
    404: {
      description: 'When Image is not stored',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const existImage: RouteConfig = {
  method: 'post',
  path: '/existImage',
  tags: [IMAGE],
  summary: 'Check if the Image with given name already exists',
  request: {
    body: {
      content: {
        'application/json': { schema: WorkflowNameSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Status of the image',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const deleteImage: RouteConfig = {
  method: 'post',
  path: '/deleteImage',
  tags: [IMAGE],
  summary: 'Delete the stored image',
  request: {
    body: {
      content: {
        'application/json': { schema: WorkflowNameSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Status of the image',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const listImages: RouteConfig = {
  method: 'post',
  path: '/listImages',
  tags: [IMAGE],
  summary: 'List the stored images',
  request: {
    body: {
      content: {
        'application/json': { schema: ListOptionsSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Status of the image',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const countImages: RouteConfig = {
  method: 'get',
  path: '/countImages',
  tags: [IMAGE],
  summary: 'Count stored images',
  responses: {
    200: {
      description: 'Status of the image',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}
