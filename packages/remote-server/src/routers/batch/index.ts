import { BatchStore } from '@mini-math/workflow'
import { Router } from 'express'
import { requireAuth, validateBody } from '../../middlewares/index.js'
import { BatchSchemas } from 'src/schemas/index.js'
import { handleCreate } from './routes/create.js'
import { Logger } from '@mini-math/logger'

export { basePath, doc } from './swagger.js'

export function create(batchStore: BatchStore, logger: Logger): Router {
  const router = Router()
  router.post(
    '/createBatch',
    requireAuth(),
    validateBody(BatchSchemas.ScheduleBatchRequestSchema),
    handleCreate(batchStore, logger),
  )

  return router
}
