import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { constants } from '../utils/constant';

const MAX_RETRIES = constants.REDIS_MAX_RETRIES;

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    if (times > MAX_RETRIES) {
      console.error('❌ Redis failed to connect after max retries. Exiting process.');
      process.exit(1);
    }

    const delay = Math.min(1000 * 2 ** times, 30000); // Exponential backoff (max 30 sec)
    console.warn(`⚠️ Redis connection failed. Retrying in ${delay / 1000} seconds...`);
    return delay;
  },
  reconnectOnError: (err) => {
    console.error('⚠️ Redis encountered an error:', err.message);
    return true;
  },
});

redis.on('connect', () => {
  console.log(`✅ Redis is connected on ${redis.options.host}:${redis.options.port}`);
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
  process.exit(1);
});

export const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'auth_limit',
  points: 5, // 5 attempts
  duration: 15 * 60, // Per 15 min
  blockDuration: 30 * 60, // Block for 30 min
});

export const generalRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'general_limit',
  points: 300, // 300 requests
  duration: 5 * 60, // 5 minutes
});

// Profile management rate limiter
export const profileRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'profile_limit',
  points: 100, // 100 profile operations
  duration: 5 * 60, // Per 5 minutes
  blockDuration: 15 * 60, // Block for 15 minutes if exceeded
});

// Search rate limiter
export const searchRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'search_limit',
  points: 60, // 60 searches
  duration: 60, // Per minute
  blockDuration: 15 * 60, // Block for 1 minute if exceeded
});
