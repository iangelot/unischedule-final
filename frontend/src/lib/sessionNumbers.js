/** Session counting — Cameroon-style « Séance 2/30 » */

const HOURS_PER_SLOT = 2;

/**
 * How many consecutive 2h slots a "block" course occupies in one sitting
 * (e.g. a 4h block = 2 slots, 08:00–12:00). 1 for normal/split courses.
 */
export function blockSlotsForCourse(course) {
  if (!course?.block) return 1;
  const h = Number(course?.hoursPerWeek) || HOURS_PER_SLOT;
  return Math.max(1, Math.round(h / HOURS_PER_SLOT));
}

/**
 * How many SESSIONS this course holds each week.
 * - Split (default): one session per slot, e.g. 4h → 2 sessions of 2h.
 * - Block: a single session per week covering the whole weekly load.
 */
export function sessionsPerWeekForCourse(course) {
  if (course?.block) return 1;
  const h = Number(course?.hoursPerWeek) || 3;
  return Math.max(1, Math.ceil(h / HOURS_PER_SLOT));
}

/** Total séances au semestre — admin value or auto from h/sem × semaines. */
export function totalSemesterSessions(course, totalWeeks = 35) {
  const manual = Number(course?.totalSessions);
  if (manual > 0) return manual;
  return sessionsPerWeekForCourse(course) * (Number(totalWeeks) || 35);
}

/**
 * Which semester session numbers belong to this calendar week?
 * Week 1 → séances 1..perWeek, week 2 → perWeek+1..2*perWeek, etc.
 */
export function semesterSessionsForWeek(course, weekNum = 1, totalWeeks = 35) {
  const perWeek = sessionsPerWeekForCourse(course);
  const total = totalSemesterSessions(course, totalWeeks);
  const durationSlots = blockSlotsForCourse(course);
  const week = Math.max(1, Number(weekNum) || 1);
  const start = (week - 1) * perWeek + 1;
  const slots = [];

  for (let i = 0; i < perWeek; i++) {
    const semesterSessionNum = start + i;
    if (semesterSessionNum > total) break;
    slots.push({
      sessionInWeek: i + 1,
      sessionsPerWeek: perWeek,
      semesterSessionNum,
      totalSemesterSessions: total,
      durationSlots,   // >1 for block courses (consecutive slots)
    });
  }
  return slots;
}

export function formatSessionLabel(session, lang = 'fr') {
  if (!session?.sessionNum) return '';
  const n = session.sessionNum;
  const t = session.totalSessions;
  return lang === 'fr' ? `Séance ${n}/${t}` : `Session ${n}/${t}`;
}
