import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { comparePassword, signToken, signRefreshToken } from '@/lib/auth';
import { ok, parseBody, unauthorized, serverError, tooManyRequests } from '@/lib/response';
import { logger } from '@/lib/logger';
import { withSecurityHeaders, setCORSHeaders, checkRateLimit, getRateLimitKey } from '@/middleware/security';
import { env } from '@/lib/env';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per email
    const email = (await req.json().catch(() => ({}))).email || req.headers.get('x-forwarded-for') || 'unknown';
    const key = `login:${email}`;
    const maxRequests = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!checkRateLimit(key, maxRequests, windowMs)) {
      logger.warn({ key }, 'Login rate limit exceeded');
      const response = tooManyRequests('Too many login attempts. Try again in 15 minutes.');
      return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
    }

    const parsed = await parseBody(req, schema);
    if ('error' in parsed) {
      const response = parsed.error;
      return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
    }

    const { email: userEmail, password } = parsed.data;

    const result = await query(
      `SELECT u.id, u.institution_id, u.email, u.full_name, u.role,
              u.password_hash, u.is_active, u.language_pref,
              i.name as inst_name, i.short_name as inst_short
       FROM institution_users u
       JOIN institutions i ON i.id = u.institution_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [userEmail]
    );

    const user = result.rows[0];
    if (!user) {
      logger.info({ email: userEmail }, 'Login failed: user not found');
      const response = unauthorized('Email ou mot de passe incorrect');
      return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
    }

    if (!user.is_active) {
      logger.warn({ userId: user.id }, 'Login attempt on inactive account');
      const response = unauthorized('Compte désactivé. Contactez votre administrateur.');
      return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      logger.info({ email: userEmail }, 'Login failed: invalid password');
      const response = unauthorized('Email ou mot de passe incorrect');
      return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
    }

    await query('UPDATE institution_users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    logger.info({ userId: user.id, email: userEmail }, 'User logged in successfully');

    const payload = { userId: user.id, institutionId: user.institution_id, role: user.role, email: user.email };

    const response = ok({
      token: signToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        languagePref: user.language_pref,
        institution: { id: user.institution_id, name: user.inst_name, shortName: user.inst_short },
      },
    });

    return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
  } catch (err) {
    logger.error({ err }, 'Login endpoint error');
    const response = serverError(err);
    return withSecurityHeaders(setCORSHeaders(response, req.headers.get('origin') || undefined));
  }
}
