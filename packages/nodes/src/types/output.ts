import z from 'zod'

export const Output = z.object({ id: z.string().optional(), name: z.string(), type: z.string() })
export type OutputType = z.infer<typeof Output>

export class OutputDefClass {
  protected outputDef: OutputType

  constructor(outputDef: OutputType) {
    this.outputDef = outputDef
  }

  getId(): string | undefined {
    return this.outputDef.id
  }

  getName(): string {
    return this.outputDef.name
  }

  getType(): string {
    return this.outputDef.type
  }

  getAll(): OutputType {
    return this.outputDef
  }
}
