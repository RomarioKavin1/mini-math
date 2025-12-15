import { z } from 'zod'

const PRIVATE_HOSTNAMES = new Set(['localhost'])
const PRIVATE_IPV4_RE =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})$/

export const WebhookUrl = z
  .string()
  .trim()
  .max(2048, 'Webhook URL must be at most 2048 characters')
  .url('Webhook URL must be a valid absolute URL')
  .superRefine((raw, ctx) => {
    let u: URL
    try {
      u = new URL(raw)
    } catch {
      // `.url()` already covers this, but keeps TypeScript happy
      return
    }

    if (u.protocol !== 'https:') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook URL must use HTTPS',
      })
    }

    // fragments are useless for servers and often indicate copy/paste junk
    if (u.hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook URL must not include a fragment (#...)',
      })
    }

    const host = u.hostname.toLowerCase()

    // Block localhost-like hosts
    if (PRIVATE_HOSTNAMES.has(host)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook URL must not point to localhost',
      })
    }

    // Block obvious private IPv4 ranges if user supplies an IP literal
    if (PRIVATE_IPV4_RE.test(host)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook URL must not point to a private or loopback IP',
      })
    }

    // Optional: keep ports sane (most webhooks are 443)
    if (u.port && u.port !== '443') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook URL must use the default HTTPS port (443)',
      })
    }
  })
  .openapi('WebhookUrl')
