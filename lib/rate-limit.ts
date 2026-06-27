import { Redis } from '@upstash/redis'

const MAX_ATTEMPTS = 5
const WINDOW_SECS = 10 * 60

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!_redis) _redis = Redis.fromEnv()
  return _redis
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: 0 }
  try {
    const redisKey = `ratelimit:${key}`
    const count = await redis.incr(redisKey)
    if (count === 1) await redis.expire(redisKey, WINDOW_SECS)
    const ttlSecs = await redis.ttl(redisKey)
    return { allowed: count <= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - count), resetAt: Date.now() + Math.max(ttlSecs, 0) * 1000 }
  } catch {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: 0 }
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try { await getRedis()?.del(`ratelimit:${key}`) } catch {}
}
