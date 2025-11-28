import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import z from 'zod'
import { StandardResponse } from './validate.js'

const AUTH = 'Authentication'
export const SiweNonceResponse = z.object({ nonce: z.string() }).openapi('SiweNonceResponse')
export const nonce: RouteConfig = {
  method: 'get',
  path: '/siwe/nonce',
  tags: [AUTH],
  summary: 'Get a single-use nonce for SIWE (Sign-In With Ethereum)',
  responses: {
    200: {
      description: 'Nonce issued',
      content: { 'application/json': { schema: SiweNonceResponse } },
    },
    429: {
      description: 'Rate limited',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
}

export const SiweVerifyBody = z
  .object({
    message: z.string().min(1),
    signature: z.string().min(1),
  })
  .openapi('SiweVerifyBody')

export const VerifyResponse = z
  .object({
    ok: z.literal(true),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.number().int().positive(),
  })
  .openapi('VerifyResponse')

export const verify: RouteConfig = {
  method: 'post',
  path: '/siwe/verify',
  tags: [AUTH],
  summary: 'Verify SIWE message + signature; establish session (cookie)',
  request: {
    body: {
      content: {
        'application/json': { schema: SiweVerifyBody },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification success; session created',
      content: { 'application/json': { schema: VerifyResponse } },
    },
    400: {
      description: 'Bad request / invalid SIWE message',
      content: { 'application/json': { schema: StandardResponse } },
    },
    401: {
      description: 'Signature invalid / nonce mismatch / expired',
      content: { 'application/json': { schema: StandardResponse } },
    },
    429: {
      description: 'Rate limited',
      content: { 'application/json': { schema: StandardResponse } },
    },
  },
}

export const logout: RouteConfig = {
  method: 'post',
  path: '/logout',
  tags: [AUTH],
  summary: 'Destroy current session',
  responses: {
    200: {
      description: 'Logged out',
      content: {
        'application/json': { schema: z.object({ ok: z.literal(true) }).openapi('LogoutResponse') },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const AuthUser = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({ example: '0x1234...abcd' }),
    chainId: z.number().int().positive().openapi({ example: 1 }),
    loggedInAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
  })
  .openapi('AuthUser')

export const MeResponse = z
  .object({
    user: AuthUser.nullable(),
  })
  .openapi('MeResponse')

export const me: RouteConfig = {
  method: 'get',
  path: '/me',
  tags: [AUTH],
  summary: 'Current authenticated user (session)',
  responses: {
    200: {
      description: 'Returns current user or null if not logged in',
      content: { 'application/json': { schema: MeResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}
