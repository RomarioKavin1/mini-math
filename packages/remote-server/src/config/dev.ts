import { makeLogger } from '@mini-math/logger'
import type { CookieOptions } from 'express-session'

const logger = makeLogger('devConfig')

/**
 * Get domain from env vars, supporting both DOMAIN and DOMAIN_HOST/DOMAIN_PORT patterns
 */
function getDomain(): string {
  if (process.env.DOMAIN) {
    return process.env.DOMAIN
  }
  const host = process.env.DOMAIN_HOST || 'localhost'
  const port = process.env.DOMAIN_PORT || process.env.PORT || '3003'
  return `${host}:${port}`
}

/**
 * Get allowed origins, supporting both CORS_ORIGIN (single) and ALLOWED_ORIGINS (multiple)
 */
function getAllowedOrigins(): string[] {
  // Support single origin via CORS_ORIGIN
  if (process.env.CORS_ORIGIN) {
    return [process.env.CORS_ORIGIN]
  }
  // Support multiple origins via ALLOWED_ORIGINS
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }
  // Default
  return ['http://localhost:3000', 'http://localhost:3003']
}

/**
 * Development configuration settings
 * These can be overridden via environment variables
 */
export const devConfig = {
  /**
   * Platform owner address for development
   * Override with INIT_PLATFORM_OWNER env var
   */
  platformOwner: process.env.INIT_PLATFORM_OWNER ?? '0x89c27f76eef3e09d798fb06a66dd461d7d21f111',

  /**
   * Server domain configuration
   * Supports: DOMAIN, or DOMAIN_HOST + DOMAIN_PORT/PORT
   */
  domain: getDomain(),

  /**
   * SIWE (Sign-In With Ethereum) domain
   * Override with SIWE_DOMAIN env var
   */
  siweDomain: process.env.SIWE_DOMAIN || getDomain(),

  /**
   * Allowed CORS origins
   * Supports: CORS_ORIGIN (single) or ALLOWED_ORIGINS (comma-separated)
   */
  allowedOrigins: getAllowedOrigins(),

  /**
   * Trust proxy setting (for reverse proxies)
   * Override with TRUST_PROXY env var (set to 'true' to enable)
   */
  trustProxy: process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production',

  /**
   * Session secret
   * Override with SESSION_SECRET env var
   */
  sessionSecret: process.env.SESSION_SECRET || 'super-long-session-secret',

  /**
   * Cookie options
   * SECURE env var controls the secure flag
   */
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.SECURE === 'true' || process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  } as CookieOptions,

  /**
   * Default credits for auto-created users
   * Override with DEFAULT_STORAGE_CREDITS and DEFAULT_EXECUTION_CREDITS env vars
   */
  defaultStorageCredits: parseInt(process.env.DEFAULT_STORAGE_CREDITS || '1000', 10),
  defaultExecutionCredits: parseInt(process.env.DEFAULT_EXECUTION_CREDITS || '1000', 10),

  /**
   * Enable verbose session logging
   * Override with VERBOSE_SESSION_LOGGING env var (set to 'false' to disable)
   */
  verboseSessionLogging: process.env.VERBOSE_SESSION_LOGGING !== 'false',
}

// Log configuration in development mode
if (process.env.NODE_ENV !== 'production') {
  logger.info('Development configuration loaded:', {
    platformOwner: devConfig.platformOwner,
    domain: devConfig.domain,
    siweDomain: devConfig.siweDomain,
    allowedOrigins: devConfig.allowedOrigins,
    trustProxy: devConfig.trustProxy,
    secure: devConfig.cookieOptions.secure,
    defaultCredits: {
      storage: devConfig.defaultStorageCredits,
      execution: devConfig.defaultExecutionCredits,
    },
  })
}
