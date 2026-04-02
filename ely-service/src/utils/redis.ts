import { createClient, type RedisClientType } from 'redis';
import { getConfig } from '../config';
import { logger } from './logger';

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    const config = getConfig();
    client = createClient({ url: config.REDIS_URL });
    client.on('error', (err) => logger.error({ err }, 'Redis error'));
    await client.connect();
    logger.info('Redis connected');
  }
  return client;
}

// Rate limiter: returns true if within limit
export async function checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const redis = await getRedis();
  const redisKey = `ely:rate:${key}`;
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }

  return count <= limit;
}

// Conversation state cache
export async function getConversationState(conversationId: number): Promise<{ humanResponded: boolean } | null> {
  const redis = await getRedis();
  const data = await redis.get(`ely:conv:${conversationId}`);
  return data ? JSON.parse(data) : null;
}

export async function setConversationState(conversationId: number, state: { humanResponded: boolean }, ttlSec = 86400): Promise<void> {
  const redis = await getRedis();
  await redis.setEx(`ely:conv:${conversationId}`, ttlSec, JSON.stringify(state));
}
