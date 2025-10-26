import { ERROR_CODES, NodeDefType, NodeFactoryType } from '@mini-math/nodes'
import { ClockResult, WorkflowDef } from './types.js'
import { bfsTraverse, hasCycle } from './helper.js'

export class Workflow {
  private nodeById: Map<string, NodeDefType>
  private outgoing: Map<string, string[]>
  private initialized: boolean = false

  constructor(
    private workflowDef: WorkflowDef,
    private nodeFactory: NodeFactoryType,
  ) {
    // Build helper maps for quick traversal.
    this.nodeById = new Map(this.workflowDef.nodes.map((n) => [n.id, n]))

    this.outgoing = new Map<string, string[]>()
    for (const n of this.workflowDef.nodes) {
      this.outgoing.set(n.id, [])
    }
    for (const e of this.workflowDef.edges) {
      if (!this.outgoing.has(e.from)) {
        this.outgoing.set(e.from, [])
      }
      this.outgoing.get(e.from)!.push(e.to)
    }

    // Bootstrap runtime if it's empty.
    if (!this.workflowDef.runtime) {
      this.workflowDef.runtime = {
        queue: [],
        visited: [],
        current: null,
        finished: false,
      }
    }

    // If it's a brand new traversal, seed BFS queue with entry.
    if (
      this.workflowDef.runtime.queue.length === 0 &&
      this.workflowDef.runtime.visited.length === 0 &&
      !this.workflowDef.runtime.finished
    ) {
      this.workflowDef.runtime.queue.push(this.workflowDef.entry)
    }
  }

  public bfs(): void {
    this.initialize()
    bfsTraverse(this.workflowDef)
  }

  private initialize(): boolean {
    if (!this.initialized) {
      if (hasCycle(this.workflowDef)) {
        throw new Error(ERROR_CODES.CYCLIC_WORKFLOW_DETECTED)
      }
      this.initialized = true
    }
    return this.initialized
  }

  public async clock(): Promise<ClockResult> {
    this.initialize()

    const rt = this.workflowDef.runtime

    // If we've already finished, we're done.
    if (rt.finished) {
      return { status: 'error', code: ERROR_CODES.WORKFLOW_IS_ALREADY_EXECUTED }
    }

    // No more queued nodes? Then this call finalizes the workflow.
    if (rt.queue.length === 0) {
      rt.current = null
      rt.finished = true
      return { status: 'finished' }
    }

    // 1. Dequeue next node id
    const currentNodeId = rt.queue.shift()!
    rt.current = currentNodeId

    // 2. Mark visited if first time
    if (!rt.visited.includes(currentNodeId)) {
      rt.visited.push(currentNodeId)
    }

    // Look up the node definition
    const nodeObj = this.nodeById.get(currentNodeId)
    if (!nodeObj) {
      // This shouldn't happen unless workflowDef is corrupted.
      // We treat it as fatal.
      throw new Error(`Node ${currentNodeId} not found in nodeById`)
    }

    // 3. Execute the node
    //    NodeFactory.make(...) should build a runnable instance for this node.
    const executable = this.nodeFactory.make(nodeObj)
    const result = await executable.execute()

    // You *could* store result somewhere here:
    // nodeObj.data = result;   // <-- careful: mutating definition might not be what you want long-term
    // For now we'll just return it to caller.

    // 4. After success: enqueue children (breadth-first expansion)
    const neighbors = this.outgoing.get(currentNodeId) ?? []
    for (const nextId of neighbors) {
      const alreadyVisited = rt.visited.includes(nextId)
      const alreadyQueued = rt.queue.includes(nextId)

      if (!alreadyVisited && !alreadyQueued) {
        rt.queue.push(nextId)
      }
    }

    // 5. If queue is now empty after this, we don't immediately flip finished.
    //    We'll let the *next* clock() call mark finished and return {status:'finished'}.
    //    This matches the step-by-step semantics you described.

    return {
      status: 'ok',
      node: nodeObj,
      result,
    }
  }

  public getCurrentNode(): NodeDefType | null {
    const rt = this.workflowDef.runtime
    if (!rt.current) return null
    return this.nodeById.get(rt.current) ?? null
  }

  public getRuntimeState() {
    return { ...this.workflowDef.runtime }
  }

  public serialize(): WorkflowDef {
    return this.workflowDef
  }

  public isFinished(): boolean {
    const rt = this.workflowDef.runtime
    return rt.finished === true || rt.queue.length === 0
  }
}
