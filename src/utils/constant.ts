import { IPlan } from '../types/subscription.types';
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

export const plan: Partial<IPlan>[] = [
  {
    name: 'mobile',
    videoQuality: 'Fair',
    resolution: '480p',
    spatialAudio: false,
    supportedDevices: ['Mobile phone', 'Tablet'],
    maxScreens: 1,
    downloadDevices: 1,
    price: 149,
  },
  {
    name: 'basic',
    videoQuality: 'Good',
    resolution: '720p (HD)',
    spatialAudio: false,
    supportedDevices: ['TV', 'Computer', 'Mobile phone', 'Tablet'],
    maxScreens: 1,
    downloadDevices: 1,
    price: 199,
  },
  {
    name: 'standard',
    videoQuality: 'Great',
    resolution: '1080p (Full HD)',
    spatialAudio: false,
    supportedDevices: ['TV', 'Computer', 'Mobile phone', 'Tablet'],
    maxScreens: 2,
    downloadDevices: 2,
    price: 499,
  },
  {
    name: 'premium',
    videoQuality: 'Best',
    resolution: '4K (Ultra HD) + HDR',
    spatialAudio: true,
    supportedDevices: ['TV', 'Computer', 'Mobile phone', 'Tablet'],
    maxScreens: 4,
    downloadDevices: 6,
    price: 649,
  },
];

export const isDevelopment = env.NODE_ENV === constants.ENVIRONMENT_DEVELOPMENT;
export const FRONTEND_URL = env.FRONTEND_URL;
