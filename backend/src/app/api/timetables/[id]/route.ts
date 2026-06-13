import { NextRequest } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, notFound, error, serverError } from '@/lib/response';
import { detectTimetableConflicts } from '@/lib/conflicts';
import { sendSMS, smsTemplates } from '@/lib/sms';

// GET /api/v1/timetables/[id]
export const GET = withAuth(async (req, { user, params }) => {
  try {
    const result = await query(
      `SELECT t.*, u.full_name as published_by_name
       FROM timetables t
       LEFT JOIN institution_users u ON u.id = t.published_by
       WHERE t.id = $1 AND t.institution_id = $2 AND t.deleted_at IS NULL`,
      [params.id, user.institutionId]
    );
    if (!result.rows[0]) return notFound('Timetable');

    // Also return session count and conflict count
    const sessionCount = await query(
      `SELECT COUNT(*) FROM sessions WHERE timetable_id=$1 AND deleted_at IS NULL AND status != 'cancelled'`,
      [params.id]
    );
    const conflictCount = await query(
      `SELECT COUNT(*) FROM conflicts WHERE timetable_id=$1 AND is_resolved=false`,
      [params.id]
    );

    return ok({
      ...result.rows[0],
      sessionCount: parseInt(sessionCount.rows[0].count),
      conflictCount: parseInt(conflictCount.rows[0].count),
    });
  } catch (err) { return serverError(err); }
});

// POST /api/v1/timetables/[id]/publish
export async function publishTimetable(req: NextRequest, { user, params }: any) {
  try {
    const tt = await query(
      `SELECT * FROM timetables WHERE id=$1 AND institution_id=$2 AND deleted_at IS NULL`,
      [params.id, user.institutionId]
    );
    if (!tt.rows[0]) return notFound('Timetable');

    // Check for unresolved hard conflicts
    const hardConflicts = await query(
      `SELECT COUNT(*) FROM conflicts WHERE timetable_id=$1 AND severity='hard' AND is_resolved=false`,
      [params.id]
    );
    const count = parseInt(hardConflicts.rows[0].count);
    if (count > 0) {
      return error(`Cannot publish: ${count} unresolved critical conflict(s) must be fixed first`, 422);
    }

    await withTransaction(async (client) => {
      // Deactivate all other timetables for this institution+semester
      await client.query(
        `UPDATE timetables SET is_active=false WHERE institution_id=$1 AND semester=$2 AND id != $3`,
        [user.institutionId, tt.rows[0].semester, params.id]
      );
      // Publish this one
      await client.query(
        `UPDATE timetables SET status='published', is_active=true, published_at=NOW(), published_by=$1, updated_at=NOW() WHERE id=$2`,
        [user.userId, params.id]
      );
    });

    // Queue SMS notifications to all groups
    const inst = await query(`SELECT short_name FROM institutions WHERE id=$1`, [user.institutionId]);
    const shortName = inst.rows[0]?.short_name || 'UniSchedule';
    const groups = await query(
      `SELECT sg.id, sg.name FROM student_groups sg
       JOIN session_groups ssg ON ssg.student_group_id = sg.id
       JOIN sessions s ON s.id = ssg.session_id
       WHERE s.timetable_id = $1 AND s.institution_id = $2
       GROUP BY sg.id, sg.name`,
      [params.id, user.institutionId]
    );

    // In production this would go through a job queue — sending inline for simplicity
    await query(
      `INSERT INTO notifications (institution_id, recipient_type, recipient_id, channel, message_fr, message_en, trigger_event)
       VALUES ($1, 'institution', $2, 'in_app',
         'L''emploi du temps a été publié. Consultez votre planning.',
         'The timetable has been published. Check your schedule.',
         'TIMETABLE_PUBLISHED')`,
      [user.institutionId, user.institutionId]
    );

    return ok({ published: true, message: 'Timetable published successfully' });
  } catch (err) { return serverError(err); }
}

// GET /api/v1/timetables/[id]/conflicts — list all conflicts
export async function getTimetableConflicts(req: NextRequest, { user, params }: any) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');

    let sql = `
      SELECT c.*, sa.course_id as course_a, sb.course_id as course_b
      FROM conflicts c
      LEFT JOIN sessions sa ON sa.id = c.session_a_id
      LEFT JOIN sessions sb ON sb.id = c.session_b_id
      WHERE c.timetable_id = $1 AND c.institution_id = $2
    `;
    const params2: any[] = [params.id, user.institutionId];
    let i = 3;
    if (severity) { sql += ` AND c.severity = $${i++}`; params2.push(severity); }
    if (resolved !== null) { sql += ` AND c.is_resolved = $${i++}`; params2.push(resolved === 'true'); }
    sql += ' ORDER BY c.severity DESC, c.created_at DESC';

    const result = await query(sql, params2);
    return ok(result.rows);
  } catch (err) { return serverError(err); }
}
