import { env } from '../config/env';

export const constants = {
  ENVIRONMENT_DEVELOPMENT: 'development',
  MAX_LOG_FILE_SIZE_MB: 5 * 1024 * 1024,
  MAX_LOG_FILE: 5,
};

export const isDevelopment = env.NODE_ENV === constants.ENVIRONMENT_DEVELOPMENT;
