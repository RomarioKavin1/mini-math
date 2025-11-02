// src/main.ts
import { NodeFactory } from '@mini-math/compiler'
import { Server } from '@mini-math/remote-server'
import { InMemoryRuntimeStore, RuntimeDef } from '@mini-math/runtime'
import { InMemoryWorkflowStore, WorkflowDef } from '@mini-math/workflow'
import { RemoteWorker } from '@mini-math/remote-worker'

import { InMemoryQueue } from '@mini-math/queue'

const nodeFactory = new NodeFactory()

const queue = new InMemoryQueue<[WorkflowDef, RuntimeDef]>()
const workflowStore = new InMemoryWorkflowStore()
const runtimeStore = new InMemoryRuntimeStore()

const worker1 = new RemoteWorker(queue, workflowStore, runtimeStore, nodeFactory, 'Simple Worker 1')
worker1.start()

const worker2 = new RemoteWorker(queue, workflowStore, runtimeStore, nodeFactory, 'Simple Worker 2')
worker2.start()

const port = Number(process.env.PORT) || 3000
const server = new Server(workflowStore, runtimeStore, nodeFactory, queue, port)

await server.start()

// optional: basic graceful shutdown hooks
const shutdown = (signal: string) => {
  console.log(`\n${signal} received, exiting...`)
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
