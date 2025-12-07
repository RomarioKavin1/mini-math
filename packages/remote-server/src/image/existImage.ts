import type { RequestHandler } from 'express'
import { ImageStore } from '@mini-math/images'
import { WorkflowNameSchemaType } from 'src/swagger/image.js'

export function handleImageExists(imageStore: ImageStore): RequestHandler {
  return async (req, res, next) => {
    try {
      const userAddress = req.user.address

      const { workflowName } = req.body as WorkflowNameSchemaType

      const exists = await imageStore.exists(userAddress, workflowName)

      return res.status(200).json({
        success: true,
        data: {
          exists,
          owner: userAddress,
          workflowName,
        },
      })
    } catch (err) {
      return next(err)
    }
  }
}
