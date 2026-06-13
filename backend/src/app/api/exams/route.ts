import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, notFound, error, parseBody, serverError } from '@/lib/response';

// GET /api/v1/exams — list all exams
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const timetableId = searchParams.get('timetable_id');

    const result = await query(
      `SELECT e.id, e.course_id, e.room_id, e.invigilator_id,
              e.exam_date, e.start_time, e.duration_minutes, e.exam_type, e.notes,
              c.code as course_code, c.name_fr as course_name_fr, c.name_en as course_name_en,
              r.name as room_name, r.capacity as room_capacity,
              l.full_name as invigilator_name,
              COALESCE(
                json_agg(json_build_object('id', sg.id, 'name', sg.name, 'enrollment', sg.current_enrollment))
                FILTER (WHERE sg.id IS NOT NULL), '[]'
              ) as groups
       FROM exams e
       JOIN courses c ON c.id = e.course_id
       JOIN rooms r ON r.id = e.room_id
       LEFT JOIN lecturers l ON l.id = e.invigilator_id
       LEFT JOIN exam_groups eg ON eg.exam_id = e.id
       LEFT JOIN student_groups sg ON sg.id = eg.group_id
       WHERE e.institution_id = $1 AND e.deleted_at IS NULL
       ${timetableId ? 'AND e.timetable_id = $2' : ''}
       GROUP BY e.id, c.code, c.name_fr, c.name_en, r.name, r.capacity, l.full_name
       ORDER BY e.exam_date ASC, e.start_time ASC`,
      timetableId ? [user.institutionId, timetableId] : [user.institutionId]
    );
    return ok(result.rows);
  } catch (err) { return serverError(err); }
});

const createSchema = z.object({
  courseId:        z.string().uuid(),
  roomId:          z.string().uuid(),
  invigilatorId:   z.string().uuid().optional(),
  groupIds:        z.array(z.string().uuid()).min(1),
  examDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:       z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(30).max(300).default(120),
  examType:        z.enum(['written','oral','practical']).default('written'),
  timetableId:     z.string().uuid().optional(),
  notes:           z.string().optional(),
});

// POST /api/v1/exams — create exam with conflict check
export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, createSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    // Conflict check: room already used at this date+time?
    const [dateStr, timeStr] = [d.examDate, d.startTime];
    const roomConflict = await query(
      `SELECT e.id FROM exams e
       WHERE e.institution_id = $1 AND e.room_id = $2
         AND e.exam_date = $3 AND e.deleted_at IS NULL
         AND tsrange(
           ($3 || ' ' || e.start_time)::timestamp,
           ($3 || ' ' || e.start_time)::timestamp + (e.duration_minutes || ' minutes')::interval
         ) && tsrange(
           ($3 || ' ' || $4)::timestamp,
           ($3 || ' ' || $4)::timestamp + ($5 || ' minutes')::interval
         )`,
      [user.institutionId, d.roomId, dateStr, timeStr, d.durationMinutes]
    );
    if (roomConflict.rows.length > 0) {
      return error('Room is already booked at this date and time', 409);
    }

    // Group conflict: any group already has an exam at this time?
    for (const groupId of d.groupIds) {
      const groupConflict = await query(
        `SELECT e.id FROM exams e
         JOIN exam_groups eg ON eg.exam_id = e.id
         WHERE e.institution_id = $1 AND eg.group_id = $2
           AND e.exam_date = $3 AND e.deleted_at IS NULL
           AND tsrange(
             ($3 || ' ' || e.start_time)::timestamp,
             ($3 || ' ' || e.start_time)::timestamp + (e.duration_minutes || ' minutes')::interval
           ) && tsrange(
             ($3 || ' ' || $4)::timestamp,
             ($3 || ' ' || $4)::timestamp + ($5 || ' minutes')::interval
           )`,
        [user.institutionId, groupId, dateStr, timeStr, d.durationMinutes]
      );
      if (groupConflict.rows.length > 0) {
        const g = await query('SELECT name FROM student_groups WHERE id=$1', [groupId]);
        return error(`Group ${g.rows[0]?.name} already has an exam at this time`, 409);
      }
    }

    // Create exam + exam_groups in a transaction
    const exam = await withTransaction(async (client) => {
      const examResult = await client.query(
        `INSERT INTO exams (institution_id, timetable_id, course_id, room_id, invigilator_id,
           exam_date, start_time, duration_minutes, exam_type, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [user.institutionId, d.timetableId||null, d.courseId, d.roomId,
         d.invigilatorId||null, d.examDate, d.startTime, d.durationMinutes, d.examType, d.notes||null]
      );
      const examId = examResult.rows[0].id;
      for (const groupId of d.groupIds) {
        await client.query('INSERT INTO exam_groups (exam_id, group_id) VALUES ($1,$2)', [examId, groupId]);
      }
      return examResult.rows[0];
    });

    return created(exam);
  } catch (err) { return serverError(err); }
});
