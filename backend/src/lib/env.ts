import { logger } from './logger';

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN?: string;
  JWT_REFRESH_EXPIRES_IN?: string;
  APP_ENV: 'development' | 'production' | 'staging';
  NODE_ENV: 'development' | 'production';
  NEXT_PUBLIC_API_URL?: string;
  SENTRY_DSN?: string;
  LOG_LEVEL?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  CORS_ORIGIN?: string;
  AFRICA_TALKING_API_KEY?: string;
  AFRICA_TALKING_USERNAME?: string;
}

function validateEnv(): EnvConfig {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(message);
    throw new Error(message);
  }

  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    APP_ENV: (process.env.APP_ENV || 'development') as any,
    NODE_ENV: (process.env.NODE_ENV || 'development') as any,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000', // 15 min
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    AFRICA_TALKING_API_KEY: process.env.AFRICA_TALKING_API_KEY,
    AFRICA_TALKING_USERNAME: process.env.AFRICA_TALKING_USERNAME,
  };

  logger.info('Environment validation passed');
  return config;
}

export const env = validateEnv();
