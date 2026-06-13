import { NextRequest } from 'next/server';
import { openApiSpec } from '@/lib/swagger';
import { ok } from '@/lib/response';

/**
 * GET /api/docs
 * Returns OpenAPI/Swagger schema as JSON
 * Used by API documentation tools and clients
 */
export async function GET(req: NextRequest) {
  return ok(openApiSpec);
}

/**
 * HEAD /api/docs
 * Quick health check for documentation availability
 */
export async function HEAD(req: NextRequest) {
  return new Response(null, { status: 200 });
}
