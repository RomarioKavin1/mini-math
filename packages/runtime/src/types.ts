import { z } from 'zod'

export const RuntimeStateSchema = z.object({
  queue: z.array(z.string()).default([]), // BFS frontier
  visited: z.array(z.string()).default([]), // nodes we've already processed
  current: z.string().nullable().default(null), // last returned nodeId
  finished: z.boolean().default(false),
})
