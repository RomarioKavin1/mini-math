import { BaseNode, OutputType } from '@mini-math/nodes'

export class WalletNode extends BaseNode {
  protected async _nodeExecutionLogic(): Promise<OutputType[]> {
    throw new Error('method not implemented')
  }
  protected async _cost(): Promise<bigint> {
    return BigInt(16)
  }
}
