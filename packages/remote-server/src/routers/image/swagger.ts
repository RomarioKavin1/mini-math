import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { ListOptionsSchema } from '@mini-math/utils'
import { CommonSchemas, IMAGE, ImageSchemas } from '../../schemas/index.js'

export const storeImage: RouteConfig = {
  method: 'post',
  path: '/storeImage',
  tags: [IMAGE],
  summary: 'Store Image',
  request: {
    body: {
      content: {
        'application/json': { schema: ImageSchemas.StoreWorkflowImageSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'When Image is stored successfully',
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
      description: 'When Image is not stored',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    409: {
      description: 'Image name already exists',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const updateImage: RouteConfig = {
  method: 'post',
  path: '/updateImage',
  tags: [IMAGE],
  summary: 'Update Image',
  request: {
    body: {
      content: {
        'application/json': { schema: ImageSchemas.StoreWorkflowImageSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'When Image is updated successfully',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    403: {
      description: 'When Image is not updated',
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
        'application/json': { schema: ImageSchemas.WorkflowNameSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Status of the image',
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
        'application/json': { schema: ImageSchemas.WorkflowNameSchema },
      },
    },
  },
  responses: {
    202: {
      description: 'When image is deleted properly',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: z.string().openapi('Name of workflow that has been deleted'),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
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
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
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
      content: {
        'application/json': { schema: CommonSchemas.StandardResponse.extend({ data: z.number() }) },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [
  countImages,
  listImages,
  deleteImage,
  existImage,
  updateImage,
  storeImage,
]
