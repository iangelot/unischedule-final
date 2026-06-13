import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { ok, notFound, serverError } from '@/lib/response';

// GET /api/v1/public/[slug]/timetable
// No authentication — serves published timetable to students
// Heavily cached (revalidate every 5 minutes)
export const revalidate = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Resolve institution by slug (short_name)
    const inst = await query(
      `SELECT id, name, short_name, language_mode
       FROM institutions WHERE LOWER(short_name) = LOWER($1) AND deleted_at IS NULL`,
      [params.slug]
    );
    if (!inst.rows[0]) return notFound('Institution');

    const institutionId = inst.rows[0].id;

    // Get active published timetable
    const tt = await query(
      `SELECT id, name, academic_year, semester, published_at
       FROM timetables
       WHERE institution_id = $1 AND status = 'published' AND is_active = true AND deleted_at IS NULL
       ORDER BY published_at DESC LIMIT 1`,
      [institutionId]
    );
    if (!tt.rows[0]) return notFound('Published timetable');
    const timetableId = tt.rows[0].id;

    // Get all sessions with full detail
    const sessions = await query(
      `SELECT
         s.id, s.day_of_week, s.slot_index, s.mode, s.session_type,
         s.is_combined, s.total_students, s.status, s.is_locked, s.is_makeup,
         c.code as course_code, c.name_fr as course_name_fr, c.name_en as course_name_en,
         l.full_name as lecturer_name, l.id as lecturer_id,
         r.name as room_name, r.capacity as room_capacity,
         COALESCE(
           json_agg(json_build_object(
             'id', sg.id, 'name', sg.name, 'mode', sg.mode,
             'enrollment', ssg.enrollment_count
           )) FILTER (WHERE sg.id IS NOT NULL), '[]'
         ) as groups
       FROM sessions s
       JOIN courses c ON c.id = s.course_id
       JOIN lecturers l ON l.id = s.lecturer_id
       JOIN rooms r ON r.id = s.room_id
       LEFT JOIN session_groups ssg ON ssg.session_id = s.id
       LEFT JOIN student_groups sg ON sg.id = ssg.student_group_id
       WHERE s.timetable_id = $1
         AND s.institution_id = $2
         AND s.status != 'cancelled'
         AND s.deleted_at IS NULL
       GROUP BY s.id, c.code, c.name_fr, c.name_en, l.full_name, l.id, r.name, r.capacity
       ORDER BY s.day_of_week ASC, s.slot_index ASC`,
      [timetableId, institutionId]
    );

    return ok({
      institution: inst.rows[0],
      timetable: tt.rows[0],
      sessions: sessions.rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { return serverError(err); }
}
