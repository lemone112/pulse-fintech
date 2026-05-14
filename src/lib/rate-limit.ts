// ============================================================================
// PULSE Rate Limiter — Simple in-memory rate limiting
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
  lastCleanup = now
}

/**
 * Rate limit by key (typically IP address)
 * @param key - Identifier (IP, user ID, etc.)
 * @param limit - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 60
): { success: boolean; remaining: number; resetAt: number } {
  cleanup()

  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const resetAt = now + windowMs

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  // Increment count
  entry.count += 1

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  store.delete(key)
}
