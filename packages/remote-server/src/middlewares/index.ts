export * from './validate.js'
export * from './runtime.js'
export * from './workflow.js'
export * from './auth.js'

import { makeLogger } from '@mini-math/logger'
import type { RequestHandler } from 'express'
import { v4 as uuidv4 } from 'uuid'

const logger = makeLogger('session-printer')
// types/express.d.ts  (ensure tsconfig includes this)
declare module 'express-serve-static-core' {
  interface Locals {
    id?: string
  }
}

export const session_printer: RequestHandler = (req, res, next) => {
  logger.trace(JSON.stringify(req.session))
  next()
}

export const assignRequestId: RequestHandler = (req, res, next) => {
  const id = uuidv4()
  req.workflowId = id
  res.locals.id = id
  next()
}
