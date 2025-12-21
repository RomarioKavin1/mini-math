import { z } from 'zod'
import type { RequestHandler } from 'express'

/** -----------------------------
 *  Zod schemas
 *  ----------------------------- */

// Raw Etherscan V2 "getabi" envelope: { status, message, result }
export const EtherscanAbiEnvelopeSchema = z.object({
  status: z.string(), // "1" or "0"
  message: z.string(), // "OK" or error
  result: z.string(), // ABI JSON string or error string
})
export type EtherscanAbiEnvelope = z.infer<typeof EtherscanAbiEnvelopeSchema>

// ABI items are heterogeneous; keep it permissive but structured.
export const AbiItemSchema = z
  .object({
    type: z.string().optional(),
    name: z.string().optional(),
    inputs: z.array(z.unknown()).optional(),
    outputs: z.array(z.unknown()).optional(),
    stateMutability: z.string().optional(),
    constant: z.boolean().optional(),
    payable: z.boolean().optional(),
    anonymous: z.boolean().optional(),
  })
  .passthrough()

export const AbiSchema = z.array(AbiItemSchema)
export type ContractAbi = z.infer<typeof AbiSchema>

// Keep payload as you added it, but make it actually validate what you mean.
export const AbiRequestPayload = z.object({
  chainId: z.union([z.string().min(1).max(100), z.number().int().min(1)]),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address'),
})

export type AbiRequest = z.infer<typeof AbiRequestPayload>

/** -----------------------------
 *  Low-level fetch (no cache)
 *  ----------------------------- */
export async function fetchContractAbiFromEtherscan(params: {
  apiKey: string
  request: AbiRequest
}): Promise<ContractAbi> {
  // Validate at the boundary (cheap + prevents weird cache keys)
  const request = AbiRequestPayload.parse(params.request)

  const url = new URL('https://api.etherscan.io/v2/api')
  url.searchParams.set('chainid', String(request.chainId))
  url.searchParams.set('module', 'contract')
  url.searchParams.set('action', 'getabi')
  url.searchParams.set('address', request.address)
  url.searchParams.set('apikey', params.apiKey)

  const resp = await fetch(url.toString(), { method: 'GET' })
  if (!resp.ok) throw new Error(`Etherscan HTTP ${resp.status}`)

  const raw = await resp.json()
  const env = EtherscanAbiEnvelopeSchema.parse(raw)

  if (env.status !== '1') {
    throw new Error(`Etherscan error: ${env.message}: ${env.result}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(env.result)
  } catch {
    throw new Error(`Etherscan returned non-JSON ABI result: ${env.result.slice(0, 120)}`)
  }

  return AbiSchema.parse(parsed)
}

/** -----------------------------
 *  Cache layer (in-memory)
 *  ----------------------------- */
const abiCache: Map<string, ContractAbi> = new Map()
const abiLastUpdated: Map<string, number> = new Map()

function abiKey(chainId: number | string, address: string) {
  return `${String(chainId)}:${address.toLowerCase()}`
}

export const AbiResponseSchema = z.object({
  chainId: z.string(),
  address: z.string(),
  abi: AbiSchema,
})

export type AbiResponse = z.infer<typeof AbiResponseSchema>
/**
 * Cached batch fetch.
 * - per-key TTL via cacheSecondsByKey
 * - one failure won't break others
 * - stale fallback if available
 */
export async function fetchContractAbiCachedBatch(
  reqs: Array<{ apiKey: string; request: AbiRequest }>,
  cacheSecondsByKey: Map<string, number>,
  defaultCacheSeconds = 600,
): Promise<Array<AbiResponse>> {
  const now = Date.now()

  const tasks = reqs.map(async (r) => {
    // Validate once per item (also normalizes types)
    const request = AbiRequestPayload.parse(r.request)

    const key = abiKey(request.chainId, request.address)
    const ttlSeconds = cacheSecondsByKey.get(key) ?? defaultCacheSeconds
    const ttlMs = ttlSeconds * 1000

    const cached = abiCache.get(key)
    const updatedAt = abiLastUpdated.get(key) ?? 0

    if (cached && ttlMs > 0 && now - updatedAt < ttlMs) {
      return {
        ok: true as const,
        chainId: String(request.chainId),
        address: request.address,
        abi: cached,
      }
    }

    try {
      const fresh = await fetchContractAbiFromEtherscan({
        apiKey: r.apiKey,
        request,
      })
      abiCache.set(key, fresh)
      abiLastUpdated.set(key, now)
      return {
        ok: true as const,
        chainId: String(request.chainId),
        address: request.address,
        abi: fresh,
      }
    } catch (e) {
      if (cached) {
        return {
          ok: true as const,
          chainId: String(request.chainId),
          address: request.address,
          abi: cached,
        }
      }
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  })

  const settled = await Promise.all(tasks)

  return settled
    .filter((x): x is Extract<typeof x, { ok: true }> => x.ok)
    .map(({ chainId, address, abi }) => ({ chainId, address, abi }))
}

const abiCacheSecondsByKey = new Map<string, number>() // key = `${chainId}:${addressLower}`
const DEFAULT_ABI_CACHE_SECONDS = 600

export function handleAbiRequest(apiKey: string): RequestHandler {
  return async (req, res) => {
    try {
      // Validate + normalize input
      const payload = AbiRequestPayload.parse(req.body as AbiRequest)

      const cacheKey = `${String(payload.chainId)}:${payload.address.toLowerCase()}`

      // Optional: set a per-contract TTL here (or manage elsewhere)
      if (!abiCacheSecondsByKey.has(cacheKey)) {
        abiCacheSecondsByKey.set(cacheKey, DEFAULT_ABI_CACHE_SECONDS)
      }

      const results = await fetchContractAbiCachedBatch(
        [{ apiKey, request: payload }],
        abiCacheSecondsByKey,
        DEFAULT_ABI_CACHE_SECONDS,
      )

      if (results.length === 0) {
        return res.status(502).json({ status: false, error: 'Failed to fetch ABI' })
      }

      // Frontend-friendly payload
      return res.json({
        status: true,
        chainId: results[0].chainId,
        address: results[0].address,
        abi: results[0].abi,
      })
    } catch (err) {
      return res
        .status(400)
        .json({ status: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
}
