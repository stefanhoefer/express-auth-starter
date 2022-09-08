import { RedisOptions } from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = 6379;

export const redisConfig: RedisOptions = {
  port: REDIS_PORT,
  host: REDIS_HOST,
  enableOfflineQueue: false,
  // autoResubscribe: false,
  // lazyConnect: true,
  maxRetriesPerRequest: 0, // <-- this seems to prevent retries and allow for try/catch
};
