import { InputType } from '@mini-math/nodes'

const PATH_TOKEN_REGEX = /[^.[\]]+|\[(?:([^"'[\]]+)|["']([^"'[\]]+)["'])\]/g

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const tokenizePath = (path: string): string[] => {
  if (!path) return []

  const tokens: string[] = []

  path.replace(PATH_TOKEN_REGEX, (segment, unquoted, quoted) => {
    tokens.push((unquoted ?? quoted ?? segment).replace(/^\[|\]$/g, ''))
    return ''
  })

  return tokens
}

export const getGlobalValue = (globalState: Record<string, unknown>, path: string): unknown => {
  const tokens = tokenizePath(path)
  if (tokens.length === 0) {
    return globalState
  }

  let current: unknown = globalState

  for (const token of tokens) {
    if (!isRecord(current) || !(token in current)) {
      return undefined
    }
    current = current[token]
  }

  return current
}

const buildPatch = (tokens: string[], value: unknown): Record<string, unknown> => {
  const patch: Record<string, unknown> = {}
  let cursor = patch

  tokens.forEach((token, index) => {
    if (index === tokens.length - 1) {
      cursor[token] = value
      return
    }

    if (!isRecord(cursor[token])) {
      cursor[token] = {}
    }

    cursor = cursor[token] as Record<string, unknown>
  })

  return patch
}

const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (isRecord(existing) && isRecord(value)) {
      target[key] = deepMerge(existing, value)
    } else {
      target[key] = value
    }
  }
  return target
}

export const setGlobalValue = (
  globalState: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  const tokens = tokenizePath(path)
  if (tokens.length === 0) {
    return {}
  }

  let current: Record<string, unknown> = globalState
  const lastIndex = tokens.length - 1

  tokens.forEach((token, index) => {
    if (index === lastIndex) {
      current[token] = value
      return
    }

    const existing = current[token]
    if (!isRecord(existing)) {
      current[token] = {}
    }
    current = current[token] as Record<string, unknown>
  })

  return buildPatch(tokens, value)
}

export const mergeInputs = (inputs: InputType[]): Record<string, unknown> => {
  const base: Record<string, unknown> = {}

  for (const input of inputs ?? []) {
    if (input.type === 'json') {
      if (isRecord(input.value)) {
        Object.assign(base, input.value)
      } else {
        base[input.name] = input.value
      }
    } else {
      base[input.name] = input.value as unknown
    }
  }

  return base
}

export const normalizeOutput = (
  base: Record<string, unknown>,
  result: unknown,
): Record<string, unknown> => {
  if (Array.isArray(result)) {
    const first = result[0]
    if (isRecord(first)) {
      return { ...base, ...first }
    }
    if (result.length === 1) {
      return { ...base, codeResult: first }
    }
    return { ...base, codeResult: result }
  }

  if (isRecord(result)) {
    return { ...base, ...result }
  }

  if (typeof result === 'undefined') {
    return { ...base }
  }

  return { ...base, codeResult: result }
}

export const mergeGlobalPatch = (
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> => deepMerge(target, patch)
