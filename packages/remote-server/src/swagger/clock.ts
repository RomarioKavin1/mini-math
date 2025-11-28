import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { ID } from './validate.js'

export const REVOKED = "This is revoked. Don't use this now"

export const clock: RouteConfig = {
  method: 'post',
  path: '/clock',
  tags: [REVOKED],
  summary: 'Clock existing workflow clocked by one unit',
  request: {
    body: {
      content: {
        'application/json': { schema: ID },
      },
    },
  },
  responses: {},
}
