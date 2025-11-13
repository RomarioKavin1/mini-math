export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }

export interface KeyValueOptions {
  namespace?: string // optional key prefix
  defaultTTL?: number // seconds; applies when per-call ttl not provided
}

/**
 * Abstract, typed KV store.
 * Implementations should store values as JSON strings and honor TTL when provided.
 */
export abstract class KeyValueStore {
  protected readonly namespace: string
  protected readonly defaultTTL?: number

  constructor(opts: KeyValueOptions = {}) {
    this.namespace = (opts.namespace ?? '').trim()
    this.defaultTTL = opts.defaultTTL
  }

  // ---- Public API (stable surface) ----
  async get<T extends JsonValue = JsonValue>(key: string): Promise<T | null> {
    const raw = await this._get(this.n(key))
    return raw == null ? null : this.deserialize<T>(raw)
  }

  async set<T extends JsonValue = JsonValue>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTTL
    const raw = this.serialize(value)
    await this._set(this.n(key), raw, ttl)
  }

  async del(key: string): Promise<boolean> {
    return (await this._del(this.n(key))) > 0
  }

  async exists(key: string): Promise<boolean> {
    return (await this._exists(this.n(key))) > 0
  }

  /**
   * keys("*") returns all keys in this namespace.
   * Supports simple `*` wildcard (converted to regex).
   */
  async keys(pattern = '*'): Promise<string[]> {
    const namespacedPattern = this.n(pattern)
    const full = await this._keys(namespacedPattern)
    // Strip namespace prefix for returned keys
    const prefix = this.nsPrefix()
    return full.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length))
  }

  async incrBy(key: string, amount = 1): Promise<number> {
    return this._incrBy(this.n(key), amount)
  }

  /**
   * TTL in seconds. Return:
   *  - > 0: seconds to expire
   *  - 0 or null: no TTL / persistent
   *  - -2: key does not exist (normalized to null)
   */
  async ttl(key: string): Promise<number | null> {
    const t = await this._ttl(this.n(key))
    if (t == null || t < 0) return null
    return t
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    return (await this._expire(this.n(key), ttlSeconds)) > 0
  }

  protected async close(): Promise<void> {
    // Optional; overridden by implementations that need teardown.
  }

  // ---- Methods for subclasses to implement ----
  protected abstract _get(key: string): Promise<string | null>
  protected abstract _set(key: string, value: string, ttlSeconds?: number): Promise<void>
  protected abstract _del(key: string): Promise<number>
  protected abstract _exists(key: string): Promise<number>
  protected abstract _keys(pattern: string): Promise<string[]>
  protected abstract _incrBy(key: string, amount: number): Promise<number>
  protected abstract _ttl(key: string): Promise<number | null>
  protected abstract _expire(key: string, ttlSeconds: number): Promise<number>

  // ---- Helpers ----
  protected nsPrefix(): string {
    return this.namespace ? `${this.namespace}:` : ''
  }

  protected n(key: string): string {
    return `${this.nsPrefix()}${key}`
  }

  protected serialize<T extends JsonValue>(value: T): string {
    return JSON.stringify(value)
  }
  protected deserialize<T extends JsonValue>(raw: string): T {
    return JSON.parse(raw) as T
  }
}
