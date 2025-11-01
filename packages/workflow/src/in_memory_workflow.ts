import { WorkflowDef, WorkflowSchema, WorkflowCore } from './types.js'
import { WorkflowResult, WorkflowStore } from './workflow.js'
import { deepClone } from '@mini-math/utils'
import { ZodError } from 'zod'

export class InMemoryWorkflowStore extends WorkflowStore {
  private readonly store = new Map<string, WorkflowDef>()

  public async get(workflowId: string, initial?: Partial<WorkflowDef>): Promise<WorkflowResult> {
    if (!workflowId) {
      return { status: false, message: 'workflowId is required', workflow: null }
    }

    const existing = this.store.get(workflowId)
    if (existing) {
      return { status: true, message: 'existing', workflow: deepClone(existing) }
    }

    // No existing workflow: only create if caller provided a valid initial shape
    if (!initial) {
      return {
        status: false,
        message: 'workflow not found and no initial provided',
        workflow: null,
      }
    }

    try {
      // Validate provided initial without id, then inject authoritative id
      const parsedWithoutId = WorkflowCore.parse(initial)
      const candidate = WorkflowSchema.parse({ ...parsedWithoutId, id: workflowId })
      this.store.set(workflowId, candidate)
      return { status: true, message: 'created', workflow: deepClone(candidate) }
    } catch (err) {
      const msg =
        err instanceof ZodError
          ? JSON.stringify(err.issues, null, 2)
          : err instanceof Error
            ? err.message
            : String(err)
      return { status: false, message: msg, workflow: null }
    }
  }

  public async update(workflowId: string, patch: Partial<WorkflowDef>): Promise<WorkflowResult> {
    if (!workflowId) {
      return { status: false, message: 'workflowId is required', workflow: null }
    }

    const existing = this.store.get(workflowId)
    if (!existing) {
      return { status: false, message: 'workflow not found', workflow: null }
    }

    try {
      // Merge patch, keep id authoritative from key, then validate
      const merged = WorkflowSchema.parse({ ...existing, ...patch, id: workflowId })
      this.store.set(workflowId, merged)
      return { status: true, message: 'updated', workflow: deepClone(merged) }
    } catch (err) {
      const msg =
        err instanceof ZodError
          ? JSON.stringify(err.issues, null, 2)
          : err instanceof Error
            ? err.message
            : String(err)
      return { status: false, message: msg, workflow: deepClone(existing) }
    }
  }
}
