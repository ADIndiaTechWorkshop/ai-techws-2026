import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createRedis(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

const DEFAULT_CACHE_TTL_SECONDS = 60;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const hit = await redis.get(key);
  if (!hit) return null;
  return JSON.parse(hit) as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_CACHE_TTL_SECONDS,
): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
