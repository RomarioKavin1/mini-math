import { RequestHandler, Router } from 'express'
import { requireAuth, validateBody } from '../../middlewares/index.js'
import {
  GrantCreditDeltaSchema,
  GrantOrRevokeRoleSchema,
  Role,
  RoleStore,
  UserStore,
} from '@mini-math/rbac'
import {
  handleDecreaseCredits,
  handleIncreaseCredits,
  handleGrantRole,
  handleRevokeRole,
} from '../../rbac/index.js'

export { doc } from './swagger.js'

export function create(
  mustHaveOneOfTheRole: (roles: Role[]) => RequestHandler,
  roleStore: RoleStore,
  userStore: UserStore,
): Router {
  const router = Router()

  router.post(
    '/grantRole',
    requireAuth(),
    validateBody(GrantOrRevokeRoleSchema),
    handleGrantRole(roleStore),
  )

  router.post(
    '/increaseCredits',
    requireAuth(),
    mustHaveOneOfTheRole([Role.PlatformOwner]),
    validateBody(GrantCreditDeltaSchema),
    handleIncreaseCredits(userStore),
  )
  router.post(
    '/decreaseCredits',
    requireAuth(),
    mustHaveOneOfTheRole([Role.PlatformOwner]),
    validateBody(GrantCreditDeltaSchema),
    handleDecreaseCredits(userStore),
  )
  router.post(
    '/revokeRole',
    requireAuth(),
    validateBody(GrantOrRevokeRoleSchema),
    handleRevokeRole(roleStore),
  )

  return router
}
