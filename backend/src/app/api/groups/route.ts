// ── STUDENT GROUPS ─────────────────────────────────────────────────────────
// src/app/api/groups/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError } from '@/lib/response';

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode');
  const level = searchParams.get('level');

  try {
    let sql = `
      SELECT sg.*, p.name as programme_name, p.short_name as programme_short
      FROM student_groups sg
      JOIN programmes p ON p.id = sg.programme_id
      WHERE sg.institution_id = $1 AND sg.deleted_at IS NULL
    `;
    const params: any[] = [user.institutionId];
    let idx = 2;

    if (mode) { sql += ` AND sg.mode = $${idx++}`; params.push(mode); }
    if (level) { sql += ` AND sg.level = $${idx++}`; params.push(Number(level)); }
    sql += ' ORDER BY sg.mode, sg.level, sg.name';

    return ok((await query(sql, params)).rows);
  } catch (err) {
    return serverError(err);
  }
});

const groupSchema = z.object({
  programmeId: z.string().uuid(),
  name: z.string().min(2).max(100),
  level: z.number().min(1).max(7),
  mode: z.enum(['day', 'evening']),
  maxStudents: z.number().min(1).default(50),
  currentEnrollment: z.number().min(0).default(0),
  academicYear: z.string().default('2025-2026'),
  semester: z.number().min(1).max(2).default(1),
});

export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, groupSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    const result = await query(
      `INSERT INTO student_groups (institution_id, programme_id, name, level, mode, max_students, current_enrollment, academic_year, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [user.institutionId, d.programmeId, d.name, d.level, d.mode, d.maxStudents, d.currentEnrollment, d.academicYear, d.semester]
    );
    return created(result.rows[0]);
  } catch (err) {
    return serverError(err);
  }
});
