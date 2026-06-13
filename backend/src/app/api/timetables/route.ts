import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, notFound, parseBody, serverError } from '@/lib/response';
import { detectTimetableConflicts } from '@/lib/conflicts';

// GET /api/v1/timetables
export const GET = withAuth(async (req, { user }) => {
  try {
    const result = await query(
      `SELECT t.*, u.full_name as published_by_name,
              COUNT(s.id) FILTER (WHERE s.deleted_at IS NULL) as session_count
       FROM timetables t
       LEFT JOIN institution_users u ON u.id = t.published_by
       LEFT JOIN sessions s ON s.timetable_id = t.id
       WHERE t.institution_id = $1 AND t.deleted_at IS NULL
       GROUP BY t.id, u.full_name
       ORDER BY t.created_at DESC`,
      [user.institutionId]
    );
    return ok(result.rows);
  } catch (err) { return serverError(err); }
});

const createSchema = z.object({
  name: z.string().min(3).max(255),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  semester: z.number().int().min(1).max(3),
});

// POST /api/v1/timetables — create new draft
export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, createSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;
  try {
    const result = await query(
      `INSERT INTO timetables (institution_id, name, academic_year, semester, status, is_active)
       VALUES ($1,$2,$3,$4,'draft',false) RETURNING *`,
      [user.institutionId, d.name, d.academicYear, d.semester]
    );
    return created(result.rows[0]);
  } catch (err) { return serverError(err); }
});
