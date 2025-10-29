import { z } from 'zod'

export const Input = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
})
export type InputType = z.infer<typeof Input>

export class InputDefClass {
  protected inputDef: InputType

  constructor(inputDef: InputType) {
    this.inputDef = inputDef
  }

  getId(): string | undefined {
    return this.inputDef.id
  }

  getName(): string {
    return this.inputDef.name
  }

  getType(): string {
    return this.inputDef.type
  }

  isRequired(): boolean | undefined {
    return this.inputDef.required
  }

  getAll(): InputType {
    return this.inputDef
  }
}
