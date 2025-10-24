import { z } from 'zod'

export const NodeRef = z.string().min(16);

export enum NodeType {
  'http.request',
  'map',
  'code',
}

export const Input = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
})

export const Output = z.object({ name: z.string(), type: z.string() })

export const NodeDef = z.object({
  id: NodeRef,
  type: z.enum(NodeType),
  name: z.string().optional(),
  config: z.json().default({}),
  data: z.json().optional(),
  inputs: z.array(z.object(Input)).default([]),
  outputs: z.array(z.object(Output)).default([]),
  executed: z.boolean().default(false),
  code: z.string().optional(),
})
