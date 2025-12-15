import { ExternalInputId, Input, NodeRef } from '@mini-math/nodes'
import { WorkflowCore } from '@mini-math/workflow'
import z from 'zod'
import { ZodIssueCode } from 'zod/v3'

export const VerifyBody = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
})

export const StandardResponse = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.any().optional(),
    data: z.any().optional(),
    issues: z.any().optional(),
  })
  .openapi('StandardResponse')

export const SiweNonceResponse = z.object({ nonce: z.string() }).openapi('SiweNonceResponse')

export const SiweVerifyBody = z
  .object({
    message: z.string().min(1),
    signature: z.string().min(1),
  })
  .openapi('SiweVerifyBody')

export const VerifyResponse = z
  .object({
    ok: z.literal(true),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.number().int().positive(),
  })
  .openapi('VerifyResponse')

const AuthUser = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({ example: '0x1234...abcd' }),
    chainId: z.number().int().positive().openapi({ example: 1 }),
    loggedInAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
  })
  .openapi('AuthUser')

export const MeResponse = z
  .object({
    user: AuthUser.nullable(),
  })
  .openapi('MeResponse')

export const LogoutResponse = z.object({ ok: z.literal(true) }).openapi('LogoutResponse')

export const IssueSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.enum(ZodIssueCode),
})
export type IssueSchemaType = z.infer<typeof IssueSchema>

export const ValidationError = z.object({
  status: z.literal(false),
  error: z.literal('ValidationError'),
  issues: IssueSchema,
})

export const ID = z
  .object({
    id: z.string(),
  })
  .openapi('workflowId')

export const IntervalScheduleSchema = z
  .object({
    type: z.literal('interval'),
    everyMs: z.number().int().positive(),
    maxRuns: z.number().int().positive().max(100),
    startAt: z.number().int().positive().optional(),
  })
  .refine((val) => val.startAt === undefined || val.startAt > Date.now(), {
    message: 'startAt must be a future timestamp (ms since epoch)',
    path: ['startAt'],
  })

export type IntervalScheduleType = z.infer<typeof IntervalScheduleSchema>

export const CronedWorkflowCoreSchema = z.object({
  workflowCore: WorkflowCore,
  intervalSchedule: IntervalScheduleSchema,
})

export type CronedWorkflowCoreType = z.infer<typeof CronedWorkflowCoreSchema>

export const ScheduleWorkflowPayload = ID.extend({
  initiateWorkflowInMs: z.number().positive().max(86400),
})

export const ExternalInputSchema = ID.extend({
  nodeId: NodeRef,
  externalInputId: ExternalInputId,
  data: Input,
})
