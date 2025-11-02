import { IQueue } from '@mini-math/queue'
import { RuntimeDef, RuntimeStore } from '@mini-math/runtime'
import { Workflow, WorkflowDef, WorkflowStore } from '@mini-math/workflow'
import { Logger, makeLogger } from '@mini-math/logger'
import { v4 } from 'uuid'
import { NodeFactoryType } from '@mini-math/compiler'

export class RemoteWorker {
  private logger: Logger
  private workerId: string
  constructor(
    private queue: IQueue<[WorkflowDef, RuntimeDef]>,
    private workflowStore: WorkflowStore,
    private runtimeStore: RuntimeStore,
    private nodeFactory: NodeFactoryType,
    name: string,
  ) {
    this.workerId = v4()
    this.logger = makeLogger(`Remote Worker: ${name}: ID: ${this.workerId}`)
  }

  public start(): void {
    this.logger.info('Worker Started')
    this.queue.onMessage(async (messageId: string, message: [WorkflowDef, RuntimeDef]) => {
      try {
        this.logger.debug(`Received message. MessageId: ${messageId}`)
        const [wfSnap, rtSnap] = message
        const workflow = new Workflow(wfSnap, this.nodeFactory, rtSnap)

        if (workflow.isFinished()) {
          await this.queue.ack(messageId)
          return
        }

        const info = await workflow.clock()
        this.logger.debug(`Clocked workflow: ${workflow.id()}`)
        this.logger.trace(JSON.stringify(info))

        const [wfNext, rtNext] = workflow.serialize()

        await Promise.all([
          this.workflowStore.update(workflow.id(), wfNext),
          this.runtimeStore.update(workflow.id(), rtNext),
        ])

        await this.queue.ack(messageId)

        // Best: schedule, fire-and-forget, but catch errors so they don't become unhandled rejections
        queueMicrotask(() => {
          void this.queue.enqueue([wfNext, rtNext]).catch((err) => {
            this.logger.error('re-enqueue failed', { err })
          })
        })
      } catch (err) {
        await this.queue.nack(messageId, true)
        this.logger.error(`Worker error: ${(err as Error).message}`)
      }
    })
  }
}
