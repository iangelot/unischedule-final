import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError } from '@/lib/response';

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const eve = searchParams.get('evening');

  try {
    let sql = `
      SELECT l.*,
        COALESCE(
          (SELECT COUNT(*) FROM sessions s
           WHERE s.lecturer_id = l.id AND s.status != 'cancelled' AND s.deleted_at IS NULL),
          0
        ) as session_count
      FROM lecturers l
      WHERE l.institution_id = $1 AND l.deleted_at IS NULL
    `;
    const params: any[] = [user.institutionId];
    let idx = 2;

    if (type) { sql += ` AND l.lecturer_type = $${idx++}`; params.push(type); }
    if (eve === 'true') { sql += ` AND l.teaches_evening = true`; }
    sql += ' ORDER BY l.lecturer_type, l.full_name';

    return ok((await query(sql, params)).rows);
  } catch (err) {
    return serverError(err);
  }
});

const lecturerSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  lecturerType: z.enum(['permanent', 'vacataire', 'visiting', 'part_time']).default('permanent'),
  maxHoursPerWeek: z.number().min(1).max(40).default(20),
  teachesDay: z.boolean().default(true),
  teachesEvening: z.boolean().default(false),
  teachesSaturday: z.boolean().default(false),
  notes: z.string().optional(),
});

export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, lecturerSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    const result = await query(
      `INSERT INTO lecturers (institution_id, full_name, email, phone, lecturer_type,
        max_hours_per_week, teaches_day, teaches_evening, teaches_saturday, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user.institutionId, d.fullName, d.email || null, d.phone || null, d.lecturerType,
       d.maxHoursPerWeek, d.teachesDay, d.teachesEvening, d.teachesSaturday, d.notes || null]
    );
    return created(result.rows[0]);
  } catch (err) {
    return serverError(err);
  }
});
