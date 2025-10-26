import { NodeDef, Input, Output, ExecutableNode } from './types.js'
import { z } from 'zod'
import { ERROR_CODES } from './errors.js'

export abstract class BaseNode implements ExecutableNode {
  constructor(private nodeDef: z.infer<typeof NodeDef>) {}

  public readInputs(): z.infer<(typeof Input)[]> {
    return this.nodeDef.inputs
  }

  public readonly(): z.infer<(typeof Output)[]> {
    if (!this.nodeDef.executed) return new Error(ERROR_CODES.NODE_IS_NOT_EXECUTED)

    return this.nodeDef.outputs
  }

  protected abstract _nodeExecutionLogc(): Promise<(typeof Output)[]>

  public async execute(): Promise<this> {
    if (this.nodeDef.executed) {
      throw new Error(ERROR_CODES.NODE_IS_ALREADY_EXECUTED)
    }

    const outputs = await this._nodeExecutionLogc()
    this.nodeDef.executed = true
    this.nodeDef.outputs = outputs

    return this
  }
}
