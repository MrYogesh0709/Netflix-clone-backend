import { env } from '../config/env';

export const constants = {
  ENVIRONMENT_DEVELOPMENT: 'development',
  MAX_LOG_FILE_SIZE_MB: 5 * 1024 * 1024,
  MAX_LOG_FILE: 5,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  bcrypt: {
    saltRounds: 10,
  },
};

export const isDevelopment = env.NODE_ENV === constants.ENVIRONMENT_DEVELOPMENT;
