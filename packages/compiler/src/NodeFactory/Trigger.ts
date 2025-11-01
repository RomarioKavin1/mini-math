import { BaseNode, OutputType, NodeDefType } from '@mini-math/nodes'
import { makeLogger, Logger } from '@mini-math/logger'
import { v4 as uuidv4 } from 'uuid'

export class TriggerNode extends BaseNode {
  private readonly logger: Logger
  constructor(nodeDef: NodeDefType) {
    super(nodeDef)

    // TODO: figure out which is better from debugging perspective
    // this.logger = makeLogger(this.nodeDef.id)
    this.logger = makeLogger('TriggerNode')
  }
  protected async _nodeExecutionLogic(): Promise<OutputType[]> {
    const nodeConfig: any = this.nodeDef.data ?? this.nodeDef.config ?? {}

    this.logger.info(`Executing trigger node ${this.nodeDef.id}`, {
      inputData: this.readInputs(),
      triggerType: nodeConfig.triggerType,
    })

    const out: Extract<OutputType, { type: 'boolean' }> = {
      id: uuidv4(),
      name: 'trigger',
      type: 'boolean',
      value: true,
    }

    return [out]
  }
  protected async _cost(): Promise<bigint> {
    return BigInt(14)
  }
}
