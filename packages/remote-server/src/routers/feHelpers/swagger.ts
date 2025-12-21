import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import z from 'zod'
import { GasPriceSchema } from './routes.js'

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

export const doc: RouteConfig[] = [gasPrices]
