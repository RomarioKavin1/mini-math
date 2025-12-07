import { RouteConfig } from '@asteasolutions/zod-to-openapi'
import { ID } from './validate.js'

export const REVOKED = 'Revoked'

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
