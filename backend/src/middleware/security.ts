import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Security headers middleware
 * Adds Helmet-equivalent headers for Next.js
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

/**
 * CORS validation
 */
export function validateCORS(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const allowedOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || ['http://localhost:5173'];

  if (!origin) return true; // Same-origin requests

  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  if (!isAllowed) {
    logger.warn({ origin, allowedOrigins }, 'CORS origin rejected');
  }

  return isAllowed;
}

/**
 * Set CORS headers in response
 */
export function setCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || ['http://localhost:5173'];
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Rate limit key generator (per user or IP)
 */
export function getRateLimitKey(req: NextRequest, useEmail = false): string {
  const authHeader = req.headers.get('authorization');
  if (useEmail && authHeader?.startsWith('Bearer ')) {
    // Extract user ID from JWT if available
    try {
      const token = authHeader.slice(7);
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return `user:${decoded.userId}`;
    } catch {
      // Fall through to IP-based limiting
    }
  }

  return `ip:${req.ip || req.headers.get('x-forwarded-for') || 'unknown'}`;
}

/**
 * Rate limit check (in-memory, production should use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests = 100, windowMs = 900000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    logger.warn({ key, count: entry.count, maxRequests }, 'Rate limit exceeded');
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 300000);
}
