import { Redis } from '@upstash/redis'

const MAX_ATTEMPTS = 5
const WINDOW_SECS  = 10 * 60

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

// Lazy client — only initialized on first request, not at build time
let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv()
  return _redis
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const redis = getRedis()
  const redisKey = `ratelimit:${key}`
  const count = await redis.incr(redisKey)
  if (count === 1) await redis.expire(redisKey, WINDOW_SECS)
  const ttlSecs = await redis.ttl(redisKey)
  const resetAt = Date.now() + Math.max(ttlSecs, 0) * 1000
  return {
    allowed:   count <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - count),
    resetAt,
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  await getRedis().del(`ratelimit:${key}`)
}
