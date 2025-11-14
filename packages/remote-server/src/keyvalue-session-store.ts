// keyvalue-session-store.ts
import type { SessionData } from 'express-session'
import { Store } from 'express-session'
import type { KeyValueStore } from '@mini-math/keystore'
import { Logger, makeLogger } from '@mini-math/logger'

interface KVSessionStoreOpts {
  prefix?: string // key prefix for session entries
  defaultTTLSeconds?: number // fallback TTL if cookie doesn't provide one
}

export class KeyValueSessionStore extends Store {
  private kv: KeyValueStore
  private prefix: string
  private defaultTTL?: number
  private logger: Logger

  constructor(kv: KeyValueStore, opts: KVSessionStoreOpts = {}) {
    super()
    this.logger = makeLogger('KeyValueSessionStore')
    this.kv = kv
    this.prefix = (opts.prefix ?? 'sess:').trim()
    this.defaultTTL = opts.defaultTTLSeconds
  }

  private k(sid: string) {
    return `${this.prefix}${sid}`
  }

  private computeTTL(sess: SessionData): number | undefined {
    // Prefer cookie.maxAge (ms)
    const maxAge = sess?.cookie?.maxAge as number | undefined
    if (typeof maxAge === 'number' && Number.isFinite(maxAge) && maxAge > 0) {
      return Math.floor(maxAge / 1000)
    }
    // Or cookie.expires (Date)
    const exp = (sess?.cookie as unknown as { expires?: Date | string })?.expires
    if (exp) {
      const expMs = new Date(exp).getTime() - Date.now()
      if (Number.isFinite(expMs) && expMs > 0) return Math.floor(expMs / 1000)
    }
    // Fallback
    return this.defaultTTL
  }

  // ---- Required by express-session.Store ----

  get(sid: string, cb: (err?: unknown, session?: SessionData | null) => void): void {
    this.logger.trace(`get sid: ${sid}`)
    this.kv
      .get<string>(this.k(sid))
      .then((raw) => {
        if (raw == null) return cb(undefined, null)
        try {
          const parsed = JSON.parse(raw) as SessionData
          return cb(undefined, parsed)
        } catch (e) {
          return cb(e)
        }
      })
      .catch((err) => cb(err))
  }

  set(sid: string, sess: SessionData, cb?: (err?: unknown) => void): void {
    this.logger.trace(`set sid: ${sid}`)
    this.logger.trace('session data')
    this.logger.trace(JSON.stringify(sess))

    const ttl = this.computeTTL(sess)
    const value = JSON.stringify(sess)
    this.kv
      .set(this.k(sid), value, ttl)
      .then(() => cb?.())
      .catch((err) => cb?.(err))
  }

  destroy(sid: string, cb?: (err?: unknown) => void): void {
    this.logger.trace(`destroy sid: ${sid}`)
    this.kv
      .del(this.k(sid))
      .then(() => cb?.())
      .catch((err) => cb?.(err))
  }

  touch(sid: string, sess: SessionData, cb?: (err?: unknown) => void): void {
    const ttl = this.computeTTL(sess)
    if (!ttl) return cb?.() // nothing to refresh
    this.kv
      .expire(this.k(sid), ttl)
      .then(() => cb?.())
      .catch((err) => cb?.(err))
  }

  // ---- Optional convenience methods ----

  length(cb: (err?: unknown, length?: number) => void): void {
    this.kv
      .keys(`${this.prefix}*`)
      .then((keys) => cb(undefined, keys.length))
      .catch((err) => cb(err))
  }

  clear(cb?: (err?: unknown) => void): void {
    this.kv
      .keys(`${this.prefix}*`)
      .then((keys) => Promise.all(keys.map((k) => this.kv.del(k))))
      .then(() => cb?.())
      .catch((err) => cb?.(err))
  }

  all(cb: (err?: unknown, sessions?: SessionData[]) => void): void {
    this.kv
      .keys(`${this.prefix}*`)
      .then(async (keys) => {
        const out: SessionData[] = []
        for (const key of keys) {
          const raw = await this.kv.get<string>(key)
          if (!raw) continue
          try {
            out.push(JSON.parse(raw) as SessionData)
          } catch {
            /* ignore malformed entry */
          }
        }
        cb(undefined, out)
      })
      .catch((err) => cb(err))
  }
}
