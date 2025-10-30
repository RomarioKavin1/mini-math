import { BaseNode, OutputType } from '@mini-math/nodes'

export class IfElseNode extends BaseNode {
  protected async _nodeExecutionLogic(): Promise<OutputType[]> {
    throw new Error('method not implemented')
  }

  protected async _cost(): Promise<bigint> {
    return BigInt(8)
  }
}
