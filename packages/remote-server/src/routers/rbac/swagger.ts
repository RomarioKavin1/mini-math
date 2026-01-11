import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { GrantCreditDeltaSchema, GrantOrRevokeRoleSchema } from '@mini-math/rbac'
import { CommonSchemas } from '../../schemas/index.js'

const RBAC = 'RBAC'

export const grantRole: RouteConfig = {
  method: 'post',
  path: '/grantRole',
  tags: [RBAC],
  summary: 'Grants Role to new users',
  request: {
    body: {
      content: {
        'application/json': { schema: GrantOrRevokeRoleSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When role is successfully granted',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized/Role-not-granted',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const increaseCredits: RouteConfig = {
  method: 'post',
  path: '/increaseCredits',
  tags: [RBAC],
  summary: 'Grants Credits to Users',
  request: {
    body: {
      content: {
        'application/json': { schema: GrantCreditDeltaSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When credit is successfully granted',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const decreaseCredits: RouteConfig = {
  method: 'post',
  path: '/decreaseCredits',
  tags: [RBAC],
  summary: 'Removes Credits from Users',
  request: {
    body: {
      content: {
        'application/json': { schema: GrantCreditDeltaSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When credit is successfully removed',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const revokeRole: RouteConfig = {
  method: 'post',
  path: '/revokeRole',
  tags: [RBAC],
  summary: 'Revoke role of a users',
  request: {
    body: {
      content: {
        'application/json': { schema: GrantOrRevokeRoleSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'When role is successfully revoked',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: CommonSchemas.ValidationError } },
    },
    401: {
      description: 'When role is not revoked',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [revokeRole, grantRole, decreaseCredits, increaseCredits]
