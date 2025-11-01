import { z } from 'zod'
import express, { Request, Response } from 'express'
import swaggerUi from 'swagger-ui-express'
import { v4 as uuidv4 } from 'uuid'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

import { Workflow, WorkflowSchema, WorkflowStore, WorkflowCore } from '@mini-math/workflow'
import { NodeFactoryType } from '@mini-math/compiler'
import { RuntimeStore } from '@mini-math/runtime'
import { makeLogger } from '@mini-math/logger'

import { openapiDoc } from './swagger.js'
import { validateBody } from './validate.js'

extendZodWithOpenApi(z)

export class Server {
  private readonly app = express()
  private readonly logger = makeLogger('RemoteServer')

  constructor(
    private workflowStore: WorkflowStore,
    private runtimeStore: RuntimeStore,
    private nodeFactory: NodeFactoryType,
    private readonly port: number | string = process.env.PORT || 3000,
  ) {
    this.configureMiddleware()
    this.configureRoutes()
  }

  public async start(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.app.listen(this.port, () => resolve())
    })
    this.logger.info(
      `API on http://localhost:${this.port}  |  Docs: http://localhost:${this.port}/docs`,
    )
  }

  private configureMiddleware(): void {
    this.app.use(express.json())
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc))
  }

  private configureRoutes(): void {
    this.app.post('/run', validateBody(WorkflowSchema), this.handleRun)
    this.app.post('/validate', validateBody(WorkflowCore), this.handleValidate)
    this.app.post('/compile', validateBody(WorkflowCore), this.handleCompile)
    this.app.post('/load', validateBody(WorkflowCore), this.handleLoad)
  }

  // Handlers as arrow functions to preserve `this`
  private handleRun = async (req: Request, res: Response) => {
    const wfId: string = req.body.id // TODO: ensure your schema guarantees this
    const { runtime, status, message } = await this.runtimeStore.get(wfId)

    if (!status || !runtime) {
      return res.status(501).json({ success: false, message })
    }

    let workflow = new Workflow(req.body, this.nodeFactory, runtime.serialize())
    this.logger.trace(`Received workflow: ${workflow.id()}`)

    if (workflow.isFinished()) {
      return res
        .status(409)
        .json({ success: false, message: `Workflow ID: ${workflow.id()} already fullfilled` })
    }

    while (!workflow.isFinished()) {
      const info = await workflow.clock()
      this.logger.debug(`Clocked workflow: ${workflow.id()}`)
      this.logger.trace(JSON.stringify(info))

      const [wf, rt] = workflow.serialize()
      this.logger.trace(JSON.stringify([wf]))
      this.logger.trace(JSON.stringify([rt]))

      await this.runtimeStore.update(workflow.id(), rt)
      workflow = new Workflow(wf, this.nodeFactory, rt)
    }

    this.logger.trace(`Workflow finished: ${workflow.id()}`)
    const [wf] = workflow.serialize()
    return res.json({ success: true, data: wf })
  }

  private handleValidate = async (req: Request, res: Response) => {
    return res.json({ success: true })
  }

  private handleCompile = async (req: Request, res: Response) => {
    try {
      const workflow = new Workflow(req.body, this.nodeFactory)
      workflow.bfs()
      return res.json({ success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: String(error) })
    }
  }

  private handleLoad = async (req: Request, res: Response) => {
    const id = uuidv4()

    // Persist a new workflow with this id (req.body is the “core” without id)
    const wfRes = await this.workflowStore.get(id, req.body)
    if (!wfRes.status || !wfRes.workflow) {
      return res.status(400).json({ success: false, message: wfRes.message })
    }
    const wfDef = wfRes.workflow

    // Create or fetch runtime for this workflow
    const rtRes = await this.runtimeStore.get(id)
    if (!rtRes.status || !rtRes.runtime) {
      return res.status(500).json({ success: false, message: rtRes.message })
    }
    const runtime = rtRes.runtime

    // Build the engine from the persisted workflow (not req.body!)
    const workflow = new Workflow(wfDef, this.nodeFactory, runtime.serialize())
    this.logger.info(`Loaded workflow: ${workflow.id()}`)

    // const [wfSnap, rtSnap] = workflow.serialize()
    // return res.status(201).json({ success: true, id, data: wfSnap, runtime: rtSnap })

    return res.status(201).json({ id })
  }
}
