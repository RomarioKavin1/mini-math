import { Logger } from '@mini-math/logger'
import type { RequestHandler } from 'express'
import z from 'zod'

export function handleGasRequest(rpcUrls: string[], logger: Logger): RequestHandler {
  return async (_, res, next) => {
    try {
      const result = await fetchGasPriceCached(rpcUrls, new Map(), logger)
      return res.json(result)
    } catch (err) {
      return res.status(400).json({ status: false, error: String(err) })
    }
  }
}

export const GasPriceSchema = z.object({
  chainId: z.number(),
  blockNumber: z.number(),

  baseFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  gasPrice: z.string().optional(),
})

const gasPricesCache: Map<string, GasPrice> = new Map()
const lastUpdated: Map<string, number> = new Map()

export async function fetchGasPriceCached(
  rpcUrl: string[],
  cacheSecondsByRpc: Map<string, number>,
  logger: Logger,
  defaultCacheSeconds = 10,
): Promise<GasPrice[]> {
  const now = Date.now()

  const tasks = rpcUrl.map(async (url) => {
    const key = url
    const ttlSeconds = cacheSecondsByRpc.get(key) ?? defaultCacheSeconds
    const ttlMs = ttlSeconds * 1000

    const cached = gasPricesCache.get(key)
    const updatedAt = lastUpdated.get(key) ?? 0

    // Serve cache if still fresh
    if (cached && ttlMs > 0 && now - updatedAt < ttlMs) {
      return cached
    }

    try {
      // Recompute (and update cache on success)
      const fresh = await fetchGasPrice(url)
      gasPricesCache.set(key, fresh)
      lastUpdated.set(key, now)
      return fresh
    } catch (err) {
      logger.error(`$${String(err)}`)
      // Don't let one failing RPC kill the whole batch.
      // If we have *any* cached value, return it (stale fallback).
      if (cached) return cached
      // Otherwise, skip this URL by returning null; we'll filter later.
      return null as any
    }
  })

  const results = await Promise.all(tasks)
  return results.filter((x): x is GasPrice => x != null)
}

export type GasPrice = z.infer<typeof GasPriceSchema>

async function fetchGasPrice(rpcUrl: string): Promise<GasPrice> {
  const rpc = async (method: string, params: any[] = []) => {
    const resp = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    if (!resp.ok) throw new Error(`RPC HTTP ${resp.status}`)
    const json = await resp.json()
    if (json.error)
      throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`)
    return json.result as any
  }

  const [chainIdHex, latestBlock] = await Promise.all([
    rpc('eth_chainId'),
    rpc('eth_getBlockByNumber', ['latest', false]),
  ])

  const chainId = Number.parseInt(chainIdHex, 16)
  const blockNumber = Number.parseInt(latestBlock.number, 16)

  // EIP-1559: baseFeePerGas exists on most modern EVM chains.
  if (latestBlock.baseFeePerGas) {
    // Get a reasonable priority fee (many nodes support this).
    let tip = '0x0'
    try {
      tip = await rpc('eth_maxPriorityFeePerGas')
    } catch {
      // fallback: 2 gwei
      tip = '0x77359400'
    }

    const base = BigInt(latestBlock.baseFeePerGas)
    const priority = BigInt(tip)
    const maxFee = base * 2n + priority // common heuristic

    return {
      chainId,
      blockNumber,
      baseFeePerGas: latestBlock.baseFeePerGas,
      maxPriorityFeePerGas: '0x' + priority.toString(16),
      maxFeePerGas: '0x' + maxFee.toString(16),
    }
  }

  // Legacy (pre-1559)
  const gasPrice = await rpc('eth_gasPrice')
  return { chainId, blockNumber, gasPrice }
}
