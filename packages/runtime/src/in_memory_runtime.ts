import { Runtime, RuntimeDef, RuntimeResult, RuntimeStateSchema, RuntimeStore } from './runtime.js'

export class InMemoryRuntimeStore extends RuntimeStore {
  private store = new Map<string, Runtime>()

  constructor() {
    super()
  }

  public async get(workflowId: string, initial?: Partial<RuntimeDef>): Promise<RuntimeResult> {
    if (!workflowId) {
      return { status: false, message: 'workflowId is required', runtime: null }
    }

    const existing = this.store.get(workflowId)
    if (existing) {
      return { status: true, message: 'existing', runtime: existing }
    }

    try {
      const def: RuntimeDef = RuntimeStateSchema.parse({
        queue: [],
        visited: [],
        current: null,
        finished: false,
        ...(initial ?? {}),
      })
      const runtime = new Runtime(def)
      this.store.set(workflowId, runtime)
      return { status: true, message: 'created', runtime }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { status: false, message: msg, runtime: null }
    }
  }

  public async update(workflowId: string, patch: Partial<RuntimeDef>): Promise<RuntimeResult> {
    const existing = this.store.get(workflowId)
    if (!existing) return { status: false, message: 'runtime not found', runtime: null }

    try {
      const merged = RuntimeStateSchema.parse({ ...existing.serialize(), ...(patch ?? {}) })
      const runtime = new Runtime(merged)
      this.store.set(workflowId, runtime)
      return { status: true, message: 'updated', runtime }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { status: false, message: msg, runtime: existing }
    }
  }
}
