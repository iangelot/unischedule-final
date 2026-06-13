import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError } from '@/lib/response';
import { sendSMS, smsTemplates } from '@/lib/sms';

// GET /api/v1/notifications — list recent notifications
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = `
      SELECT n.*, s.id as session_id
      FROM notifications n
      LEFT JOIN sessions s ON s.id = n.session_id
      WHERE n.institution_id = $1
    `;
    const params: any[] = [user.institutionId];
    if (status) { sql += ` AND n.status = $2`; params.push(status); }
    sql += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return ok(result.rows);
  } catch (err) { return serverError(err); }
});

const sendSchema = z.object({
  event: z.enum(['TIMETABLE_PUBLISHED', 'SESSION_CANCELLED', 'SUBSTITUTE_ASSIGNED', 'MAKEUP_SCHEDULED', 'CUSTOM']),
  groupIds: z.array(z.string().uuid()).min(1),
  sessionId: z.string().uuid().optional(),
  messageFr: z.string().min(5).max(160),
  messageEn: z.string().min(5).max(160).optional(),
  channel: z.enum(['sms', 'whatsapp', 'in_app']).default('sms'),
});

// POST /api/v1/notifications/send — send notification to groups
export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, sendSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    const inst = await query(
      'SELECT short_name, language_mode FROM institutions WHERE id = $1',
      [user.institutionId]
    );
    const institution = inst.rows[0];

    // Get phone numbers for lecturers in these groups (group leaders / reps)
    // In practice you'd have a students table — here we notify the group's lecturers
    const lecturers = await query(
      `SELECT DISTINCT l.phone, l.full_name
       FROM lecturers l
       JOIN sessions s ON s.lecturer_id = l.id
       JOIN session_groups sg ON sg.session_id = s.id
       WHERE s.institution_id = $1 AND sg.student_group_id = ANY($2::uuid[])
         AND l.phone IS NOT NULL AND s.deleted_at IS NULL`,
      [user.institutionId, d.groupIds]
    );

    const results = [];

    for (const group of d.groupIds) {
      // Log notification in DB
      const notif = await query(
        `INSERT INTO notifications
           (institution_id, recipient_type, recipient_id, channel, message_fr, message_en, trigger_event, session_id, status)
         VALUES ($1, 'group', $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING id`,
        [user.institutionId, group, d.channel, d.messageFr, d.messageEn || null, d.event, d.sessionId || null]
      );
      results.push({ groupId: group, notificationId: notif.rows[0].id });
    }

    // Actually send SMS if channel is sms
    if (d.channel === 'sms' && lecturers.rows.length > 0) {
      const phones = lecturers.rows.map((l: any) => l.phone).filter(Boolean);
      if (phones.length > 0) {
        const smsResult = await sendSMS({
          to: phones,
          message: institution?.language_mode === 'en' ? (d.messageEn || d.messageFr) : d.messageFr,
        });

        // Update notification status
        if (smsResult.success) {
          await query(
            `UPDATE notifications SET status = 'sent', sent_at = NOW(), provider_ref = $1
             WHERE institution_id = $2 AND trigger_event = $3 AND created_at >= NOW() - INTERVAL '10 seconds'`,
            [smsResult.messageId || 'sent', user.institutionId, d.event]
          );
        }
      }
    }

    return ok({
      sent: results.length,
      results,
      smsDispatched: d.channel === 'sms' ? lecturers.rows.length : 0,
    });
  } catch (err) { return serverError(err); }
});
