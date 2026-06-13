import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { ok, unauthorized, parseBody, serverError } from '@/lib/response';

const schema = z.object({ refreshToken: z.string() });

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, schema);
  if ('error' in parsed) return parsed.error;

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const result = await query(
      `SELECT id, institution_id, email, role FROM institution_users
       WHERE id = $1 AND is_active = true AND deleted_at IS NULL`,
      [payload.userId]
    );
    const user = result.rows[0];
    if (!user) return unauthorized('User not found');

    const jwtPayload = { userId: user.id, institutionId: user.institution_id, role: user.role, email: user.email };
    return ok({ token: signToken(jwtPayload), refreshToken: signRefreshToken(jwtPayload) });
  } catch {
    return unauthorized('Invalid or expired refresh token');
  }
}
