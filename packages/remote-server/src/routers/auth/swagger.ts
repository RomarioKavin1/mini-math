import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { CommonSchemas, AuthSchemas } from '../../schemas/index.js'

const AUTH = 'Authentication'

const nonce: RouteConfig = {
  method: 'get',
  path: '/siwe/nonce',
  tags: [AUTH],
  summary: 'Get a single-use nonce for SIWE (Sign-In With Ethereum)',
  responses: {
    200: {
      description: 'Nonce issued',
      content: { 'application/json': { schema: AuthSchemas.SiweNonceResponse } },
    },
    429: {
      description: 'Rate limited',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
}

const verify: RouteConfig = {
  method: 'post',
  path: '/siwe/verify',
  tags: [AUTH],
  summary: 'Verify SIWE message + signature; establish session (cookie)',
  request: {
    body: {
      content: {
        'application/json': { schema: AuthSchemas.SiweVerifyBody },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification success; session created',
      content: { 'application/json': { schema: AuthSchemas.VerifyResponse } },
    },
    400: {
      description: 'Bad request / invalid SIWE message',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    401: {
      description: 'Signature invalid / nonce mismatch / expired',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
    429: {
      description: 'Rate limited',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
}

const logout: RouteConfig = {
  method: 'post',
  path: '/logout',
  tags: [AUTH],
  summary: 'Destroy current session',
  responses: {
    200: {
      description: 'Logged out',
      content: {
        'application/json': { schema: AuthSchemas.LogoutResponse },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

const me: RouteConfig = {
  method: 'get',
  path: '/me',
  tags: [AUTH],
  summary: 'Current authenticated user (session)',
  responses: {
    200: {
      description: 'Returns current user or null if not logged in',
      content: { 'application/json': { schema: AuthSchemas.MeResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [nonce, verify, logout, me]
