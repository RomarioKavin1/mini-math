import { z } from 'zod'
import express, { Request, Response } from 'express'
import session from 'express-session'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

import {
  Workflow,
  WorkflowSchema,
  WorkflowStore,
  WorkflowCore,
  WorkflowDef,
} from '@mini-math/workflow'
import { NodeFactoryType } from '@mini-math/compiler'
import { RuntimeDef, RuntimeStore } from '@mini-math/runtime'
import { makeLogger } from '@mini-math/logger'

import { ID, openapiDoc } from './swagger.js'
import {
  assignRequestId,
  createNewRuntime,
  validateBody,
  createNewWorkflow,
  revertIfNoWorkflow,
  revertIfNoRuntime,
  attachUserIfPresent,
  getNonce,
  requireAuth,
  session_printer,
} from './middlewares/index.js'
import { IQueue } from '@mini-math/queue'
import { logout, verifySiwe } from './auth.js'

import { KeyValueSessionStore } from './keyvalue-session-store.js'
import { KeyValueStore } from '@mini-math/keystore'

extendZodWithOpenApi(z)

declare module 'express-serve-static-core' {
  interface Request {
    id?: string
    workflowId?: string
    workflow?: WorkflowDef
    runtime?: RuntimeDef
  }
}

export class Server {
  private readonly app = express()
  private readonly logger = makeLogger('RemoteServer')

  constructor(
    private workflowStore: WorkflowStore,
    private runtimeStore: RuntimeStore,
    private nodeFactory: NodeFactoryType,
    private queue: IQueue<[WorkflowDef, RuntimeDef]>,
    private kvs: KeyValueStore,
    private domainWithPort: string,
    private readonly session_secret: string,
    private readonly secure: boolean,
  ) {
    this.configureMiddleware()
    this.configureRoutes()
  }

  public async start(): Promise<void> {
    const [host, portStr] = this.domainWithPort.split(':')
    const port = Number(portStr ?? 3000)

    await new Promise<void>((resolve) => {
      // this.app.listen(`${this.port}`, () => resolve())
      this.app.listen(port, host, () => resolve())
    })
    this.logger.info(`API on ${this.domainWithPort}  |  Docs: ${this.domainWithPort}/docs`)
  }

  private configureMiddleware(): void {
    const store = new KeyValueSessionStore(this.kvs, {
      prefix: 'sess:',
      defaultTTLSeconds: 60 * 60 * 24,
    })

    this.app.use(session_printer)
    this.app.use(express.json())
    this.app.use(helmet())

    this.app.use(
      session({
        name: 'sid',
        secret: this.session_secret,
        store,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: this.secure,
          maxAge: 1000 * 60 * 60 * 24,
        },
      }),
    )

    this.app.use(attachUserIfPresent())

    type SwaggerInterceptorReq = {
      credentials?: 'include' | 'omit' | 'same-origin'
    } & Record<string, unknown>

    this.app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(openapiDoc, {
        swaggerOptions: {
          // Ensure cookies are sent with "Try it out"
          withCredentials: true,
          requestInterceptor: (req: SwaggerInterceptorReq) => {
            req.credentials = 'include'
            return req
          },
        },
      }),
    )
  }

  private configureRoutes(): void {
    this.app.post(
      '/run',
      validateBody(WorkflowSchema),
      createNewWorkflow(this.workflowStore),
      createNewRuntime(this.runtimeStore),
      this.handleRun,
    )
    this.app.post('/validate', validateBody(WorkflowCore), this.handleValidate)
    this.app.post('/compile', validateBody(WorkflowCore), this.handleCompile)
    this.app.post(
      '/load',
      validateBody(WorkflowCore),
      assignRequestId,
      createNewWorkflow(this.workflowStore),
      createNewRuntime(this.runtimeStore),
      this.handleLoad,
    )
    this.app.post(
      '/clock',
      validateBody(ID),
      revertIfNoWorkflow(this.workflowStore),
      revertIfNoRuntime(this.runtimeStore),
      this.handleClockWorkflow,
    )
    this.app.post(
      '/initiate',
      validateBody(ID),
      revertIfNoWorkflow(this.workflowStore),
      revertIfNoRuntime(this.runtimeStore),
      this.handleInitiateWorkflow,
    )
    this.app.post(
      '/fetch',
      validateBody(ID),
      revertIfNoWorkflow(this.workflowStore),
      revertIfNoRuntime(this.runtimeStore),
      this.handleFetchWorkflowResult,
    )

    this.app.get('/siwe/nonce', getNonce())
    this.app.post('/siwe/verify', verifySiwe(this.domainWithPort))
    this.app.post('/logout', logout())

    this.app.get('/me', requireAuth(), (req, res) => {
      if (req?.session?.user) {
        return res.json({ user: req.session.user })
      } else {
        return res.status(404).json({ user: null })
      }
    })
  }

  // Handlers as arrow functions to preserve `this`
  private handleRun = async (req: Request, res: Response) => {
    const runtime = req.runtime

    let workflow = new Workflow(req.body, this.nodeFactory, runtime)
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
      this.logger.trace(JSON.stringify(wf))
      this.logger.trace(JSON.stringify(rt))

      if (info.status == 'error') {
        return res.status(400).json({
          status: info.status,
          error: info.code,
          data: { workflow: wf, runtime: rt },
        })
      }

      if (info.status == 'terminated') {
        return res.status(410).json({
          status: info.status,
          data: { workflow: wf, runtime: rt, node: info.node, exec: info.exec },
        })
      }

      await this.workflowStore.update(workflow.id(), wf)
      await this.runtimeStore.update(workflow.id(), rt)
      workflow = new Workflow(wf, this.nodeFactory, rt)
    }

    this.logger.trace(`Workflow finished: ${workflow.id()}`)
    const [wf] = workflow.serialize()
    this.workflowStore.delete(workflow.id())
    this.runtimeStore.delete(workflow.id())
    return res.json(wf)
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
    // Build the engine from the persisted workflow (not req.body!)

    const wfDef = req.workflow as WorkflowDef // TODO: enfore this by types
    const rtDef = req.runtime

    const workflow = new Workflow(wfDef, this.nodeFactory, rtDef)
    this.logger.info(`Loaded workflow: ${workflow.id()}`)

    // TODO: fix this from types perspective
    return res.status(201).json({ id: req.workflowId })
  }

  private handleClockWorkflow = async (req: Request, res: Response) => {
    const wfDef = req.workflow as WorkflowDef // TODO: enfore this by types
    const rtDef = req.runtime

    const workflow = new Workflow(wfDef, this.nodeFactory, rtDef)
    if (workflow.isFinished()) {
      return res
        .status(409)
        .json({ success: false, message: `Workflow ID: ${workflow.id()} already fullfilled` })
    }

    const [_wfDef, _rtDef] = workflow.serialize()
    this.workflowStore.update(workflow.id(), _wfDef)
    this.runtimeStore.update(workflow.id(), _rtDef)

    const info = await workflow.clock()
    if (info.status == 'error') {
      return res.status(400).json({
        status: info.status,
        error: info.code,
        data: { workflow: _wfDef, runtime: _rtDef },
      })
    }

    if (info.status == 'terminated') {
      return res.status(410).json({
        status: info.status,
        data: { workflow: _wfDef, runtime: _rtDef, node: info.node, exec: info.exec },
      })
    }

    return res.json(_wfDef)
  }

  private handleInitiateWorkflow = async (req: Request, res: Response) => {
    const wfDef = req.workflow as WorkflowDef // TODO: enfore this by types
    const rtDef = req.runtime as RuntimeDef // TODO: enfore this by types

    const workflow = new Workflow(wfDef, this.nodeFactory, rtDef)
    if (workflow.isFinished()) {
      return res
        .status(409)
        .json({ success: false, message: `Workflow ID: ${workflow.id()} already fullfilled` })
    }

    this.queue.enqueue([wfDef, rtDef])
    return res.json({ success: true })
  }

  private handleFetchWorkflowResult = async (req: Request, res: Response) => {
    const wfDef = req.workflow as WorkflowDef // TODO: enfore this by types
    const rtDef = req.runtime as RuntimeDef // TODO: enfore this by types

    const workflow = new Workflow(wfDef, this.nodeFactory, rtDef)
    if (!workflow.isFinished()) {
      return res.status(206).json(wfDef)
    } else {
      return res.status(200).json(wfDef)
    }
  }
}
