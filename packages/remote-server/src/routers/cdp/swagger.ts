import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { ListOptionsSchema, makeListResultSchema } from '@mini-math/utils'
import { CdpAccountNameSchema } from '@mini-math/secrets'
import { CommonSchemas, CDP, CdpSchemas } from '../../schemas/index.js'
import z from 'zod'

const createAccount: RouteConfig = {
  method: 'post',
  path: '/cdp/account',
  tags: [CDP],
  summary: 'Create or get a CDP account',
  request: {
    body: {
      content: {
        'application/json': { schema: CdpSchemas.CreateAccountSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Account created or retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: CdpSchemas.AccountResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

const getAccount: RouteConfig = {
  method: 'get',
  path: '/cdp/account/{accountName}',
  tags: [CDP],
  summary: 'Get a CDP account by name',
  request: {
    params: z.object({
      accountName: z.string().describe('Name of the account'),
    }),
  },
  responses: {
    200: {
      description: 'Account retrieved successfully',
      content: { 'application/json': { schema: CdpSchemas.AccountCheckResponseSchema } },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

const getTokenBalances: RouteConfig = {
  method: 'get',
  path: '/cdp/token-balances',
  tags: [CDP],
  summary: 'Get token balances for an address',
  request: {
    query: CdpSchemas.TokenBalancesQuerySchema,
  },
  responses: {
    200: {
      description: 'Token balances retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: CdpSchemas.TokenBalancesResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

const requestFaucet: RouteConfig = {
  method: 'post',
  path: '/cdp/faucet',
  tags: [CDP],
  summary: 'Request faucet tokens',
  request: {
    body: {
      content: {
        'application/json': { schema: CdpSchemas.FaucetRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Faucet request successful',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: CdpSchemas.FaucetResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

const exportAccount: RouteConfig = {
  method: 'post',
  path: '/cdp/export-account',
  tags: [CDP],
  summary: 'Export account private key',
  request: {
    body: {
      content: {
        'application/json': { schema: CdpSchemas.ExportAccountSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Account exported successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: CdpSchemas.ExportAccountResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: CommonSchemas.StandardResponse } },
    },
  },
  security: [{ cookieAuth: [] }],
}

const fetchAccountNames: RouteConfig = {
  method: 'post',
  path: '/cdp/fetchAccountNames',
  tags: [CDP],
  summary: 'List the cdp account names',
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
      content: {
        'application/json': {
          schema: CommonSchemas.StandardResponse.extend({
            data: makeListResultSchema(CdpAccountNameSchema),
          }),
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [
  createAccount,
  getAccount,
  getTokenBalances,
  fetchAccountNames,
  exportAccount,
  requestFaucet,
]
