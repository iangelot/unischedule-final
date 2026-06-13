import { query } from './db';

export interface ConflictResult {
  id: string;
  type: string;
  severity: 'hard' | 'soft';
  sessionIds: string[];
  description: string;
}

// Full server-side conflict detection for a timetable
// Runs efficient SQL queries using indexes — no in-memory scanning
export async function detectTimetableConflicts(
  timetableId: string,
  institutionId: string
): Promise<ConflictResult[]> {
  const conflicts: ConflictResult[] = [];

  // 1. Lecturer double-booked (same slot, two different sessions)
  const lecConflicts = await query(`
    SELECT s1.id as s1_id, s2.id as s2_id,
           l.full_name as lecturer_name,
           s1.day_of_week, s1.slot_index
    FROM sessions s1
    JOIN sessions s2 ON s2.id > s1.id
      AND s2.timetable_id = s1.timetable_id
      AND s2.lecturer_id = s1.lecturer_id
      AND s2.day_of_week = s1.day_of_week
      AND s2.slot_index = s1.slot_index
      AND s2.status != 'cancelled'
    JOIN lecturers l ON l.id = s1.lecturer_id
    WHERE s1.timetable_id = $1
      AND s1.institution_id = $2
      AND s1.status != 'cancelled'
      AND s1.deleted_at IS NULL
      AND s2.deleted_at IS NULL
  `, [timetableId, institutionId]);

  lecConflicts.rows.forEach(r => {
    conflicts.push({
      id: `lec-${r.s1_id}-${r.s2_id}`,
      type: 'LECTURER_DOUBLE_BOOKED',
      severity: 'hard',
      sessionIds: [r.s1_id, r.s2_id],
      description: `${r.lecturer_name} est assigné(e) à deux séances simultanées (jour ${r.day_of_week}, créneau ${r.slot_index})`,
    });
  });

  // 2. Room double-booked
  const roomConflicts = await query(`
    SELECT s1.id as s1_id, s2.id as s2_id,
           r.name as room_name,
           s1.day_of_week, s1.slot_index
    FROM sessions s1
    JOIN sessions s2 ON s2.id > s1.id
      AND s2.timetable_id = s1.timetable_id
      AND s2.room_id = s1.room_id
      AND s2.day_of_week = s1.day_of_week
      AND s2.slot_index = s1.slot_index
      AND s2.status != 'cancelled'
    JOIN rooms r ON r.id = s1.room_id
    WHERE s1.timetable_id = $1
      AND s1.institution_id = $2
      AND s1.status != 'cancelled'
      AND s1.deleted_at IS NULL
      AND s2.deleted_at IS NULL
  `, [timetableId, institutionId]);

  roomConflicts.rows.forEach(r => {
    conflicts.push({
      id: `room-${r.s1_id}-${r.s2_id}`,
      type: 'ROOM_DOUBLE_BOOKED',
      severity: 'hard',
      sessionIds: [r.s1_id, r.s2_id],
      description: `${r.room_name} est réservée deux fois au même créneau`,
    });
  });

  // 3. Group clash — same group in two sessions at the same time
  const groupClash = await query(`
    SELECT sg1.session_id as s1_id, sg2.session_id as s2_id,
           g.name as group_name,
           s1.day_of_week, s1.slot_index
    FROM session_groups sg1
    JOIN session_groups sg2 ON sg2.student_group_id = sg1.student_group_id
      AND sg2.session_id != sg1.session_id
    JOIN sessions s1 ON s1.id = sg1.session_id
    JOIN sessions s2 ON s2.id = sg2.session_id
      AND s2.day_of_week = s1.day_of_week
      AND s2.slot_index = s1.slot_index
      AND s2.status != 'cancelled'
    JOIN student_groups g ON g.id = sg1.student_group_id
    WHERE s1.timetable_id = $1
      AND s1.institution_id = $2
      AND s1.status != 'cancelled'
      AND s1.deleted_at IS NULL
      AND s2.deleted_at IS NULL
      AND sg1.session_id < sg2.session_id
  `, [timetableId, institutionId]);

  groupClash.rows.forEach(r => {
    conflicts.push({
      id: `grp-${r.s1_id}-${r.s2_id}`,
      type: 'GROUP_CLASH',
      severity: 'hard',
      sessionIds: [r.s1_id, r.s2_id],
      description: `Le groupe ${r.group_name} a deux cours simultanés`,
    });
  });

  // 4. Room capacity exceeded
  const capConflicts = await query(`
    SELECT s.id, r.name as room_name, r.capacity,
           SUM(sg.enrollment_count) as total_students
    FROM sessions s
    JOIN rooms r ON r.id = s.room_id
    JOIN session_groups sg ON sg.session_id = s.id
    WHERE s.timetable_id = $1
      AND s.institution_id = $2
      AND s.status != 'cancelled'
      AND s.deleted_at IS NULL
    GROUP BY s.id, r.name, r.capacity
    HAVING SUM(sg.enrollment_count) > r.capacity
  `, [timetableId, institutionId]);

  capConflicts.rows.forEach(r => {
    conflicts.push({
      id: `cap-${r.id}`,
      type: 'CAPACITY_EXCEEDED',
      severity: 'hard',
      sessionIds: [r.id],
      description: `${r.room_name} (cap. ${r.capacity}) ne peut pas accueillir ${r.total_students} étudiants`,
    });
  });

  // 5. Lecturer fatigue — same lecturer teaching day AND evening on same day (soft)
  const fatigueConflicts = await query(`
    SELECT s1.id as s1_id, s2.id as s2_id,
           l.full_name as lecturer_name, s1.day_of_week
    FROM sessions s1
    JOIN sessions s2 ON s2.lecturer_id = s1.lecturer_id
      AND s2.day_of_week = s1.day_of_week
      AND s2.mode = 'evening'
      AND s2.status != 'cancelled'
      AND s2.id != s1.id
    JOIN lecturers l ON l.id = s1.lecturer_id
    WHERE s1.timetable_id = $1
      AND s1.institution_id = $2
      AND s1.mode = 'day'
      AND s1.status != 'cancelled'
      AND s1.deleted_at IS NULL
      AND s2.timetable_id = $1
      AND s2.deleted_at IS NULL
    LIMIT 20
  `, [timetableId, institutionId]);

  const fatigueAdded = new Set<string>();
  fatigueConflicts.rows.forEach(r => {
    const key = `${r.lecturer_name}-${r.day_of_week}`;
    if (!fatigueAdded.has(key)) {
      fatigueAdded.add(key);
      conflicts.push({
        id: `fat-${r.s1_id}`,
        type: 'LECTURER_FATIGUE',
        severity: 'soft',
        sessionIds: [r.s1_id, r.s2_id],
        description: `${r.lecturer_name} enseigne en journée ET en soirée le jour ${r.day_of_week}`,
      });
    }
  });

  return conflicts;
}

// Save conflict results to the database (called after generation or manual change)
export async function saveConflicts(
  timetableId: string,
  institutionId: string,
  conflicts: ConflictResult[]
): Promise<void> {
  // Clear existing unresolved conflicts for this timetable
  await query(
    `DELETE FROM conflicts WHERE timetable_id = $1 AND is_resolved = false`,
    [timetableId]
  );

  if (conflicts.length === 0) return;

  // Batch insert new conflicts
  for (const c of conflicts) {
    await query(`
      INSERT INTO conflicts (timetable_id, institution_id, conflict_type, severity,
        session_a_id, session_b_id, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      timetableId, institutionId, c.type, c.severity,
      c.sessionIds[0] || null,
      c.sessionIds[1] || null,
      c.description,
    ]);
  }
}
