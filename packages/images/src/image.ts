import { WorkflowCoreType, WorkflowCore } from '@mini-math/workflow'
import { ListOptions, ListResult } from '@mini-math/utils'
import z from 'zod'

export const WorkflowImage = z.object({ workflowName: z.string(), image: WorkflowCore })
export type WorkflowImageType = z.infer<typeof WorkflowImage>

export abstract class ImageStore {
  private initialized = false

  /** Called exactly once before any operation. */
  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
      this.initialized = true
    }
  }

  public async create(
    owner: string,
    workflowName: string,
    core: WorkflowCoreType,
  ): Promise<boolean> {
    await this.ensureInitialized()
    return this._create(owner, workflowName, core)
  }

  public async get(owner: string, workflowName: string): Promise<WorkflowCoreType | undefined> {
    await this.ensureInitialized()
    return this._get(owner, workflowName)
  }

  public async update(
    owner: string,
    workflowName: string,
    patch: Partial<WorkflowCoreType>,
  ): Promise<boolean> {
    await this.ensureInitialized()
    return this._update(owner, workflowName, patch)
  }

  public async exists(owner: string, workflowName: string): Promise<boolean> {
    await this.ensureInitialized()
    return this._exists(owner, workflowName)
  }

  public async delete(owner: string, workflowName: string): Promise<boolean> {
    await this.ensureInitialized()
    return this._delete(owner, workflowName)
  }

  public async list(options?: ListOptions): Promise<ListResult<WorkflowImageType>> {
    await this.ensureInitialized()
    return this._list(options)
  }

  public async count(owner: string): Promise<number> {
    await this.ensureInitialized()
    return this._count(owner)
  }

  protected abstract initialize(): Promise<void>

  protected abstract _create(
    owner: string,
    workflowName: string,
    core: WorkflowCoreType,
  ): Promise<boolean>

  protected abstract _get(
    owner: string,
    workflowName: string,
  ): Promise<WorkflowCoreType | undefined>

  protected abstract _update(
    owner: string,
    workflowName: string,
    patch: Partial<WorkflowCoreType>,
  ): Promise<boolean>

  protected abstract _exists(owner: string, workflowName: string): Promise<boolean>

  protected abstract _delete(owner: string, workflowName: string): Promise<boolean>

  protected abstract _list(options?: ListOptions): Promise<ListResult<WorkflowImageType>>

  protected abstract _count(owner: string): number
}
