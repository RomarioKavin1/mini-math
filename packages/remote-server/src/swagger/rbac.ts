import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { GrantOrRevokeRoleSchema } from '@mini-math/rbac'
import { StandardResponse } from './validate.js'

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
      content: { 'application/json': { schema: StandardResponse } },
    },
    401: {
      description: 'When role is not granted',
      content: { 'application/json': { schema: StandardResponse } },
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
      content: { 'application/json': { schema: StandardResponse } },
    },
    401: {
      description: 'When role is not revoked',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}
