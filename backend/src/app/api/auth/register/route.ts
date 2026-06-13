import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withTransaction } from '@/lib/db';
import { hashPassword, signToken, signRefreshToken } from '@/lib/auth';
import { created, error, parseBody, serverError } from '@/lib/response';

const schema = z.object({
  institutionName: z.string().min(3).max(255),
  shortName: z.string().min(2).max(50),
  country: z.string().length(2).default('CM'),
  city: z.string().min(2).max(100),
  adminName: z.string().min(2).max(255),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  language: z.enum(['fr', 'en']).default('fr'),
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, schema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    const result = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM institution_users WHERE email = $1', [d.adminEmail]);
      if (existing.rows.length > 0) throw new Error('EMAIL_EXISTS');

      const inst = await client.query(
        `INSERT INTO institutions (name, short_name, country, city, language_mode)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [d.institutionName, d.shortName, d.country, d.city, d.language]
      );
      const institutionId = inst.rows[0].id;

      const user = await client.query(
        `INSERT INTO institution_users (institution_id, email, full_name, role, language_pref, password_hash)
         VALUES ($1, $2, $3, 'admin', $4, $5) RETURNING id`,
        [institutionId, d.adminEmail, d.adminName, d.language, await hashPassword(d.adminPassword)]
      );

      await client.query(
        `INSERT INTO timetables (institution_id, name, academic_year, semester, status, is_active)
         VALUES ($1, 'Semestre 1 — 2025-2026', '2025-2026', 1, 'draft', true)`,
        [institutionId]
      );

      return { institutionId, userId: user.rows[0].id };
    });

    const payload = { userId: result.userId, institutionId: result.institutionId, role: 'admin', email: d.adminEmail };
    return created({ token: signToken(payload), refreshToken: signRefreshToken(payload), institutionId: result.institutionId });
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') return error('Un compte avec cet email existe déjà', 409);
    return serverError(err);
  }
}
