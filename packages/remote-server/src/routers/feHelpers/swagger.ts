import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import z from 'zod'
import { GasPriceSchema } from './routes/gasPrices.js'
import { AbiRequestPayload, AbiResponseSchema } from './routes/abi.js'

const FeHelper = 'Frontend Helpers'
export const basePath = '/feHelpers'

export const gasPrices: RouteConfig = {
  method: 'get',
  path: `${basePath}/gasPrices`,
  tags: [FeHelper],
  summary: 'Fetch Latest Gas Prices',
  responses: {
    200: {
      description: 'Gas Prices',
      content: {
        'application/json': { schema: z.array(GasPriceSchema) },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const abiRequest: RouteConfig = {
  method: 'post',
  path: `${basePath}/abi`,
  tags: [FeHelper],
  summary: 'Fetch ABI of contract',
  request: {
    body: {
      content: {
        'application/json': { schema: AbiRequestPayload },
      },
    },
  },
  responses: {
    200: {
      description: 'ABI of contract',
      content: {
        'application/json': { schema: z.array(AbiResponseSchema) },
      },
    },
  },
  security: [{ cookieAuth: [] }],
}

export const doc: RouteConfig[] = [gasPrices, abiRequest]
