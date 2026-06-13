import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ok, serverError } from '@/lib/response';

/**
 * Health check endpoint
 * Used by load balancers, orchestrators, and monitoring systems
 * Does NOT require authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Check database connectivity
    const dbCheck = await query('SELECT 1');
    const dbHealthy = dbCheck.rowCount === 1;

    if (!dbHealthy) {
      logger.error('Database health check failed');
      return serverError(new Error('Database unavailable'));
    }

    // Return healthy status
    return ok({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
    });
  } catch (err) {
    logger.error({ err }, 'Health check failed');

    // Return unhealthy status but still respond
    return ok({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * HEAD request for lightweight health checks
 */
export async function HEAD(req: NextRequest) {
  try {
    await query('SELECT 1');
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
