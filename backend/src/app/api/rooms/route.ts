import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { withAuth, withAdmin } from '@/middleware/withAuth';
import { ok, created, parseBody, serverError } from '@/lib/response';

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const minCap = searchParams.get('minCapacity');
  const evening = searchParams.get('evening');

  try {
    let sql = `
      SELECT r.*, b.name as building_name,
        COALESCE(
          (SELECT COUNT(*) FROM sessions s
           WHERE s.room_id = r.id AND s.status != 'cancelled' AND s.deleted_at IS NULL),
          0
        ) as session_count
      FROM rooms r
      LEFT JOIN buildings b ON b.id = r.building_id
      WHERE r.institution_id = $1 AND r.deleted_at IS NULL
    `;
    const params: any[] = [user.institutionId];
    let idx = 2;

    if (type) { sql += ` AND r.room_type = $${idx++}`; params.push(type); }
    if (minCap) { sql += ` AND r.capacity >= $${idx++}`; params.push(Number(minCap)); }
    if (evening === 'true') { sql += ` AND r.available_until >= '20:00'`; }
    sql += ' ORDER BY r.room_type, r.capacity DESC';

    return ok((await query(sql, params)).rows);
  } catch (err) {
    return serverError(err);
  }
});

const roomSchema = z.object({
  name: z.string().min(2).max(100),
  capacity: z.number().min(1),
  roomType: z.enum(['amphitheater', 'classroom', 'lab', 'seminar']).default('classroom'),
  isSharedResource: z.boolean().default(false),
  hasProjector: z.boolean().default(false),
  hasAc: z.boolean().default(false),
  availableFrom: z.string().default('07:00'),
  availableUntil: z.string().default('22:00'),
  notes: z.string().optional(),
  buildingId: z.string().uuid().optional(),
});

export const POST = withAdmin(async (req, { user }) => {
  const parsed = await parseBody(req, roomSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  try {
    const result = await query(
      `INSERT INTO rooms (institution_id, building_id, name, capacity, room_type,
        is_shared_resource, has_projector, has_ac, available_from, available_until, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [user.institutionId, d.buildingId || null, d.name, d.capacity, d.roomType,
       d.isSharedResource, d.hasProjector, d.hasAc, d.availableFrom, d.availableUntil, d.notes || null]
    );
    return created(result.rows[0]);
  } catch (err) {
    return serverError(err);
  }
});
