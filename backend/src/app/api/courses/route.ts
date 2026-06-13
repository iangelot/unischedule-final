import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError } from '@/lib/response';

// GET /api/v1/courses — list all courses for institution
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const shareable = searchParams.get('shareable');
    const requiresLab = searchParams.get('requires_lab');
    const search = searchParams.get('search');

    let sql = `
      SELECT c.id, c.code, c.name, c.name_fr, c.name_en,
             c.credits, c.hours_per_week, c.session_duration_minutes,
             c.sessions_per_week, c.course_type, c.requires_lab, c.is_shareable,
             d.name as department_name
      FROM courses c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.institution_id = $1 AND c.deleted_at IS NULL
    `;
    const params: any[] = [user.institutionId];
    let i = 2;

    if (shareable !== null) { sql += ` AND c.is_shareable = $${i++}`; params.push(shareable === 'true'); }
    if (requiresLab !== null) { sql += ` AND c.requires_lab = $${i++}`; params.push(requiresLab === 'true'); }
    if (search) { sql += ` AND (c.code ILIKE $${i} OR c.name ILIKE $${i} OR c.name_fr ILIKE $${i} OR c.name_en ILIKE $${i})`; params.push(`%${search}%`); i++; }

    sql += ' ORDER BY c.code ASC';
    const result = await query(sql, params);
    return ok(result.rows);
  } catch (err) { return serverError(err); }
});

const createSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(255),
  nameFr: z.string().optional(),
  nameEn: z.string().optional(),
  credits: z.number().int().min(1).max(30).default(3),
  hoursPerWeek: z.number().int().min(1).max(20).default(4),
  sessionDurationMinutes: z.number().int().min(30).max(300).default(120),
  sessionsPerWeek: z.number().int().min(1).max(10).default(2),
  courseType: z.enum(['lecture','lab','tutorial','seminar']).default('lecture'),
  requiresLab: z.boolean().default(false),
  isShareable: z.boolean().default(false),
  departmentId: z.string().uuid().optional(),
});

// POST /api/v1/courses — create a course
export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, createSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;
  try {
    const result = await query(
      `INSERT INTO courses (institution_id, code, name, name_fr, name_en, credits, hours_per_week,
         session_duration_minutes, sessions_per_week, course_type, requires_lab, is_shareable, department_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [user.institutionId, d.code, d.name, d.nameFr||d.name, d.nameEn||d.name,
       d.credits, d.hoursPerWeek, d.sessionDurationMinutes, d.sessionsPerWeek,
       d.courseType, d.requiresLab, d.isShareable, d.departmentId||null]
    );
    return created(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return serverError(new Error('Course code already exists'));
    return serverError(err);
  }
});
