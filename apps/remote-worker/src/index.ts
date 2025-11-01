// src/main.ts
import { NodeFactory } from '@mini-math/compiler'
import { Server } from './server.js'
import { InMemoryRuntimeStore } from '@mini-math/runtime'
import { InMemoryWorkflowStore } from '@mini-math/workflow'

const workflowStore = new InMemoryWorkflowStore()
const runtimeStore = new InMemoryRuntimeStore()
const nodeFactory = new NodeFactory()

const port = Number(process.env.PORT) || 3000
const server = new Server(workflowStore, runtimeStore, nodeFactory, port)

await server.start()

// optional: basic graceful shutdown hooks
const shutdown = (signal: string) => {
  console.log(`\n${signal} received, exiting...`)
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
