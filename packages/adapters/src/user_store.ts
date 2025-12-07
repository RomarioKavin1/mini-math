// src/postgresUserStore.ts
import { eq, sql } from 'drizzle-orm'
import type { ListOptions, ListResult } from '@mini-math/utils'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { UserStore, type UserRecord, type CreditDelta } from '@mini-math/rbac'
import { users } from './db/schema/0_users'
import * as schema from './db/schema/0_users.js'
import { makeLogger, Logger } from '@mini-math/logger'

type Db = NodePgDatabase<typeof schema>

export class PostgresUserStore extends UserStore {
  private db!: Db
  private pool!: Pool
  private logger: Logger

  private readonly postgresUrl: string

  constructor(postgresUrl: string) {
    super()
    this.postgresUrl = postgresUrl
    this.logger = makeLogger('PostgresUserStore')
  }

  private handleError(method: string, err: unknown, context?: Record<string, unknown>): never {
    this.logger.error(
      JSON.stringify({
        err,
        method,
        ...context,
      }) + ' PostgresUserStore operation failed',
    )
    throw err
  }

  protected async initialize(): Promise<void> {
    try {
      this.logger.debug('Initializing')
      // 1. Create PG pool
      this.pool = new Pool({
        connectionString: this.postgresUrl,
      })

      // 2. Wrap pool in Drizzle
      this.db = drizzle(this.pool, {
        schema,
      })

      // 3. Optional sanity check – ensure DB is reachable
      await this.db.execute(sql`select 1`)
      this.logger.info('initialized successfully')
    } catch (err) {
      this.handleError('initialize', err, { postgresUrl: this.postgresUrl })
    }
  }

  protected async _create(
    userId: string,
    storageCredits: number,
    executionCredit: number,
  ): Promise<boolean> {
    const res = await this.db
      .insert(users)
      .values({
        userId,
        storageCredits,
        executionCredit,
      })
      .onConflictDoNothing()
      .returning({ userId: users.userId })

    return res.length > 0
  }

  protected async _get(userId: string): Promise<UserRecord | undefined> {
    const [row] = await this.db
      .select({
        userId: users.userId,
        storageCredits: users.storageCredits,
        executionCredit: users.executionCredit,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1)

    if (!row) return undefined

    return {
      userId: row.userId,
      storageCredits: row.storageCredits ?? 0,
      executionCredit: row.executionCredit ?? 0,
    }
  }

  protected async _upsert(
    userId: string,
    patch: Partial<Omit<UserRecord, 'userId'>>,
  ): Promise<UserRecord> {
    // Try update first
    const existing = await this._get(userId)

    if (!existing) {
      // create new
      const created: UserRecord = {
        userId,
        storageCredits: patch.storageCredits ?? 0,
        executionCredit: patch.executionCredit ?? 0,
      }

      await this.db
        .insert(users)
        .values({
          userId,
          storageCredits: created.storageCredits,
          executionCredit: created.executionCredit,
        })
        .onConflictDoUpdate({
          target: users.userId,
          set: {
            storageCredits: sql`excluded."storageCredits"`,
            executionCredit: sql`excluded."executionCredits"`,
          },
        })

      return created
    }

    const updated: UserRecord = {
      userId,
      storageCredits: patch.storageCredits ?? existing.storageCredits,
      executionCredit: patch.executionCredit ?? existing.executionCredit,
    }

    await this.db
      .update(users)
      .set({
        storageCredits: updated.storageCredits,
        executionCredit: updated.executionCredit,
      })
      .where(eq(users.userId, userId))

    return updated
  }

  protected async _adjustCredits(userId: string, delta: CreditDelta): Promise<UserRecord> {
    const existing = (await this._get(userId)) ?? {
      userId,
      storageCredits: 0,
      executionCredit: 0,
    }

    const updated: UserRecord = {
      userId,
      storageCredits: existing.storageCredits + (delta.storageCredits ?? 0),
      executionCredit: existing.executionCredit + (delta.executionCredit ?? 0),
    }

    await this.db
      .insert(users)
      .values({
        userId,
        storageCredits: updated.storageCredits,
        executionCredit: updated.executionCredit,
      })
      .onConflictDoUpdate({
        target: users.userId,
        set: {
          storageCredits: updated.storageCredits,
          executionCredit: updated.executionCredit,
        },
      })

    return updated
  }

  protected async _exists(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1)

    return !!row
  }

  protected async _delete(userId: string): Promise<boolean> {
    const res = await this.db
      .delete(users)
      .where(eq(users.userId, userId))
      .returning({ userId: users.userId })

    return res.length > 0
  }

  protected async _list(options?: ListOptions): Promise<ListResult<UserRecord>> {
    const cursor = options?.cursor ? Number.parseInt(options.cursor, 10) || 0 : 0
    const limit = options?.limit ?? 50

    const totalRows = await this.db.select({ value: sql<number>`count(*)` }).from(users)

    const total = totalRows[0]?.value ?? 0

    const rows = await this.db
      .select({
        userId: users.userId,
        storageCredits: users.storageCredits,
        executionCredit: users.executionCredit,
      })
      .from(users)
      .offset(cursor)
      .limit(limit)

    const items: UserRecord[] = rows.map((r) => ({
      userId: r.userId,
      storageCredits: r.storageCredits ?? 0,
      executionCredit: r.executionCredit ?? 0,
    }))

    const nextCursor = cursor + limit < total ? String(cursor + limit) : undefined

    return { items, nextCursor }
  }
}
