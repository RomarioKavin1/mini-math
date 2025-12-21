import { Router } from 'express'
import { handleGasRequest } from './routes.js'
import { Logger } from '@mini-math/logger'

export { doc, basePath } from './swagger.js'

export function create(logger: Logger): Router {
  const router = Router()

  const rpcUrls: string[] = [
    'https://polygon.drpc.org',
    'https://base.llamarpc.com',
    'https://eth.llamarpc.com',
    'https://arb1.arbitrum.io/rpc',
    'https://mainnet.optimism.io',
  ]
  router.get('/gasPrices', handleGasRequest(rpcUrls, logger))
  return router
}
