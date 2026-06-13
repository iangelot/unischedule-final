import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { withAuth, withTimetabler } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError, notFound } from '@/lib/response';
import { detectTimetableConflicts, saveConflicts } from '@/lib/conflicts';

// GET /api/sessions?timetableId=&mode=&day=&lecturerId=
export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const timetableId = searchParams.get('timetableId');
  const mode = searchParams.get('mode');
  const day = searchParams.get('day');
  const lecturerId = searchParams.get('lecturerId');
  const groupId = searchParams.get('groupId');

  try {
    let sql = `
      SELECT s.id, s.course_id, s.lecturer_id, s.room_id, s.day_of_week, s.slot_index,
             s.mode, s.session_type, s.is_combined, s.total_students, s.status,
             s.cancel_reason, s.substitute_id, s.is_locked, s.is_makeup, s.is_generated,
             s.notes, s.created_at,
             c.code as course_code, c.name_fr as course_name_fr, c.name_en as course_name_en,
             l.full_name as lecturer_name, l.phone as lecturer_phone,
             r.name as room_name, r.capacity as room_capacity,
             COALESCE(
               json_agg(json_build_object(
                 'groupId', sg.student_group_id,
                 'groupName', g.name,
                 'enrollment', sg.enrollment_count
               )) FILTER (WHERE sg.student_group_id IS NOT NULL),
               '[]'
             ) as groups
      FROM sessions s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN lecturers l ON l.id = s.lecturer_id
      LEFT JOIN rooms r ON r.id = s.room_id
      LEFT JOIN session_groups sg ON sg.session_id = s.id
      LEFT JOIN student_groups g ON g.id = sg.student_group_id
      WHERE s.institution_id = $1 AND s.deleted_at IS NULL
    `;
    const params: any[] = [user.institutionId];
    let idx = 2;

    if (timetableId) { sql += ` AND s.timetable_id = $${idx++}`; params.push(timetableId); }
    if (mode) { sql += ` AND s.mode = $${idx++}`; params.push(mode); }
    if (day !== null) { sql += ` AND s.day_of_week = $${idx++}`; params.push(Number(day)); }
    if (lecturerId) { sql += ` AND s.lecturer_id = $${idx++}`; params.push(lecturerId); }
    if (groupId) { sql += ` AND EXISTS (SELECT 1 FROM session_groups sg2 WHERE sg2.session_id = s.id AND sg2.student_group_id = $${idx++})`; params.push(groupId); }

    sql += ' GROUP BY s.id, c.code, c.name_fr, c.name_en, l.full_name, l.phone, r.name, r.capacity ORDER BY s.day_of_week, s.slot_index';

    const result = await query(sql, params);
    return ok(result.rows);
  } catch (err) {
    return serverError(err);
  }
});

const createSchema = z.object({
  timetableId: z.string().uuid(),
  courseId: z.string().uuid(),
  lecturerId: z.string().uuid(),
  roomId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(5),
  slotIndex: z.number().min(0).max(6),
  mode: z.enum(['day', 'evening']),
  groups: z.array(z.object({ groupId: z.string().uuid(), enrollmentCount: z.number() })).min(1),
  sessionType: z.string().default('regular'),
  notes: z.string().optional(),
});

// POST /api/sessions
export const POST = withTimetabler(async (req, { user }) => {
  const parsed = await parseBody(req, createSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  const totalStudents = d.groups.reduce((s, g) => s + g.enrollmentCount, 0);

  try {
    const result = await withTransaction(async (client) => {
      const sess = await client.query(
        `INSERT INTO sessions (institution_id, timetable_id, course_id, lecturer_id, room_id,
          day_of_week, slot_index, mode, session_type, is_combined, total_students, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [user.institutionId, d.timetableId, d.courseId, d.lecturerId, d.roomId,
         d.dayOfWeek, d.slotIndex, d.mode, d.sessionType, d.groups.length > 1, totalStudents, d.notes || null]
      );
      const sessionId = sess.rows[0].id;

      for (const g of d.groups) {
        await client.query(
          'INSERT INTO session_groups (session_id, student_group_id, enrollment_count) VALUES ($1,$2,$3)',
          [sessionId, g.groupId, g.enrollmentCount]
        );
      }

      // Log action
      await client.query(
        `INSERT INTO audit_log (institution_id, action, entity_type, entity_id, after_state)
         VALUES ($1,'SESSION_CREATED','sessions',$2,$3)`,
        [user.institutionId, sessionId, JSON.stringify(d)]
      );

      return sessionId;
    });

    // Run conflict detection after save
    const conflicts = await detectTimetableConflicts(d.timetableId, user.institutionId);
    await saveConflicts(d.timetableId, user.institutionId, conflicts);

    return created({ id: result, conflictCount: conflicts.filter(c => c.severity === 'hard').length });
  } catch (err) {
    return serverError(err);
  }
});
