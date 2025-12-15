import type { RequestHandler } from 'express'
import { ImageStore } from '@mini-math/images'

import type { ListOptions } from '@mini-math/utils'

export function handleListImages(imageStore: ImageStore): RequestHandler {
  return async (req, res, next) => {
    try {
      const options = req.body as ListOptions
      const result = await imageStore.list(options)

      return res.status(200).json({
        success: true,
        data: {
          items: result.items,
          nextCursor: result.nextCursor,
        },
      })
    } catch (err) {
      return next(err)
    }
  }
}
