import { env } from './env';

export const constants = {
  ENVIRONMENT_DEVELOPMENT: 'development',
  MAX_LOG_FILE_SIZE_MB: 5 * 1024 * 1024,
  MAX_LOG_FILE: 5,
  REDIS_MAX_RETRIES: 10,
  JSON_LIMIT: '1mb',
  jwt: {
    secret: env.JWT_SECRET || 'your-secret-key',
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    refreshExpiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  bcrypt: {
    saltRounds: 10,
  },
  MAX_PROFILES: 6,
};

export const isDevelopment = env.NODE_ENV === constants.ENVIRONMENT_DEVELOPMENT;
