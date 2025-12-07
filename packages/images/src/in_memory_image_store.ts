import { WorkflowCoreType } from '@mini-math/workflow'
import { ListOptions, ListResult } from '@mini-math/utils'
import { ImageStore, WorkflowImageType } from './image.js'

export class InMemoryImageStore extends ImageStore {
  private store: Map<string, Map<string, WorkflowCoreType>>
  constructor() {
    super()
    this.store = new Map()
  }
  protected async initialize(): Promise<void> {
    return
  }
  protected async _create(
    owner: string,
    workflowName: string,
    core: WorkflowCoreType,
  ): Promise<boolean> {
    let ownerMap = this.store.get(owner)
    if (!ownerMap) {
      ownerMap = new Map()
      this.store.set(owner, ownerMap)
    }

    // return false if already exists
    if (ownerMap.has(workflowName)) {
      return false
    }

    ownerMap.set(workflowName, core)
    return true
  }

  protected async _get(owner: string, workflowName: string): Promise<WorkflowCoreType | undefined> {
    const ownerMap = this.store.get(owner)
    if (!ownerMap) return undefined
    return ownerMap.get(workflowName)
  }

  protected async _update(
    owner: string,
    workflowName: string,
    patch: Partial<WorkflowCoreType>,
  ): Promise<boolean> {
    const ownerMap = this.store.get(owner)
    if (!ownerMap) return false

    const existing = ownerMap.get(workflowName)
    if (!existing) return false

    // shallow merge is fine because WorkflowCoreType is a plain object
    const updated: WorkflowCoreType = { ...existing, ...patch }
    ownerMap.set(workflowName, updated)
    return true
  }

  protected async _exists(owner: string, workflowName: string): Promise<boolean> {
    const ownerMap = this.store.get(owner)
    return ownerMap?.has(workflowName) ?? false
  }

  protected async _delete(owner: string, workflowName: string): Promise<boolean> {
    const ownerMap = this.store.get(owner)
    if (!ownerMap) return false

    const deleted = ownerMap.delete(workflowName)
    // clean up empty owner maps
    if (ownerMap.size === 0) {
      this.store.delete(owner)
    }
    return deleted
  }

  protected async _list(options?: ListOptions): Promise<ListResult<WorkflowImageType>> {
    const all: WorkflowImageType[] = []

    // flatten all owners into a single list of { workflowName, image }
    for (const [, workflows] of this.store) {
      for (const [workflowName, image] of workflows) {
        all.push({ workflowName, image })
      }
    }

    const startIndex = options?.cursor ? Number.parseInt(options.cursor, 10) || 0 : 0
    const limit = options?.limit ?? all.length

    const items = all.slice(startIndex, startIndex + limit)
    const nextIndex = startIndex + limit
    const nextCursor = nextIndex < all.length ? String(nextIndex) : undefined

    return { items, nextCursor }
  }

  protected _count(owner: string): number {
    const ownerMap = this.store.get(owner)
    return ownerMap ? ownerMap.size : 0
  }
}
