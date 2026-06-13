/** Session counting — Cameroon-style « Séance 2/30 » */

const HOURS_PER_SLOT = 2;

/** How many timetable slots this course needs each week (≈2h per slot). */
export function sessionsPerWeekForCourse(course) {
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
