import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

export function initSentry() {
  if (!env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: env.NODE_ENV === 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  logger.info('Sentry initialized');
}

export function captureException(error: Error, context?: Record<string, any>) {
  logger.error({ err: error, context }, 'Capturing exception');
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error') {
  logger.log({ level }, message);
  if (env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

export default Sentry;
