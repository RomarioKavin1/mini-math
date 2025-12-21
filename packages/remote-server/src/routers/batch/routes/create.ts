import type { RequestHandler } from 'express'
import { BatchStore } from '@mini-math/workflow'
import { Logger } from '@mini-math/logger'
import { BatchSchemas } from '../../../schemas/index.js'
import { v4 as uuidv4 } from 'uuid'

export function handleCreate(batchStore: BatchStore, logger: Logger): RequestHandler {
  return async (req, res) => {
    try {
      const userAddress = req.user.address
      const payload = req.body as BatchSchemas.ScheduleBatchRequest

      const creations = []
      for (let index = 0; index < payload.schedulesInMs.length; index++) {
        creations.push(payload.workflowCore)
      }

      const batchId = uuidv4()
      const result = await batchStore.create(userAddress, batchId, creations)
      if (result) {
        return res.status(200).json({ status: true, data: { batchId } })
      }

      return res.status(400).json({ status: false, message: 'failed creating batch jobs' })
    } catch (ex) {
      logger.error(`${String(ex)}`)

      return res
        .status(400)
        .json({ status: false, data: String(ex), message: 'Failed creating batch jobs' })
    }
  }
}
