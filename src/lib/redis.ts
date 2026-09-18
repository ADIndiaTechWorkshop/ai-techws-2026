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
