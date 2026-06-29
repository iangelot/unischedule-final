// Dashboard / utilization analytics — all derived from the current week's
// sessions plus the course/teacher/room data. Pure & reusable (Dashboard +
// a future Master Grid utilization view).
import { TIME_SLOTS } from '../db';
import { coursesForGroup } from './courseUtils';
import { sessionsPerWeekForCourse, totalSemesterSessions } from './sessionNumbers';

const SLOT_HOURS = 2;

function slotCounts(institutionType) {
  const day = (institutionType === 'secondary'
    ? TIME_SLOTS.secondary.filter(s => !s.isBreak)
    : TIME_SLOTS.university.filter(s => !s.isBreak)).length;
  const eve = institutionType === 'secondary' ? 0 : TIME_SLOTS.evening.length;
  return { day, eve };
}

export function computeStats({ courses, lecturers, rooms, groups, sessions, currentWeek, totalWeeks, institutionType, numDays, filterGroupId = null, scope = 'week' }) {
  const cw = Number(currentWeek) || 1;
  const tw = Number(totalWeeks) || 35;
  const { day: daySlotCount, eve: eveSlotCount } = slotCounts(institutionType);

  // Scope everything to one class when a filter is set.
  const group = filterGroupId ? groups.find(g => g.id === filterGroupId) : null;
  const sess = filterGroupId ? sessions.filter(s => (s.groups || []).includes(filterGroupId)) : sessions;
  // For semester scope, weekly figures are projected across the remaining weeks.
  const scopeMult = scope === 'semester' ? tw : 1;

  // ── Semester progress (week-based) ──
  const semesterPct = Math.min(100, Math.round((cw / tw) * 100));

  // ── Per-subject coverage: sessions scheduled up to & incl. the current week ──
  const usedCourseIds = new Set();
  groups.forEach(g => coursesForGroup(g, courses).forEach(c => usedCourseIds.add(c.id)));
  const subjectCourses = group
    ? coursesForGroup(group, courses)
    : courses.filter(c => usedCourseIds.has(c.id));
  const subjectProgress = subjectCourses
    .map(c => {
      const perWeek = sessionsPerWeekForCourse(c);
      const total = totalSemesterSessions(c, tw);
      const done = Math.min(cw * perWeek, total);
      return { id: c.id, code: c.code, name_fr: c.name_fr, name_en: c.name_en, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    })
    .sort((a, b) => a.pct - b.pct);   // least-covered first (what needs attention)

  // ── Teacher weekly load (this week) ──
  const lecSlots = {};
  sess.forEach(s => { if (s.lecId) lecSlots[s.lecId] = (lecSlots[s.lecId] || 0) + (s.durationSlots || 1); });
  const teacherLoad = lecturers
    .filter(l => !filterGroupId || (lecSlots[l.id] || 0) > 0)   // only this class's teachers when filtered
    .map(l => {
      const hours = (lecSlots[l.id] || 0) * SLOT_HOURS;
      const max = Number(l.maxHours) || 0;
      return { id: l.id, name: l.name, hours, max, over: max > 0 && hours > max, pct: max ? Math.round((hours / max) * 100) : 0 };
    })
    .sort((a, b) => b.hours - a.hours);

  // ── Room utilization (this week) ──
  const roomSlotsUsed = {};
  sess.forEach(s => { if (s.roomId) roomSlotsUsed[s.roomId] = (roomSlotsUsed[s.roomId] || 0) + (s.durationSlots || 1); });
  const roomUtil = rooms
    .map(r => {
      const cap = (daySlotCount + (r.eve ? eveSlotCount : 0)) * numDays;
      const used = roomSlotsUsed[r.id] || 0;
      return { id: r.id, name: r.name, used, cap, pct: cap ? Math.round((used / cap) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  // ── Sessions per day (this week) ──
  const byDay = Array.from({ length: numDays }, () => 0);
  sess.forEach(s => { if (s.day >= 0 && s.day < numDays) byDay[s.day] += 1; });

  const totalHours = sess.reduce((sum, s) => sum + (s.durationSlots || 1) * SLOT_HOURS, 0) * scopeMult;
  const avgRoomUtil = roomUtil.length ? Math.round(roomUtil.reduce((a, r) => a + r.pct, 0) / roomUtil.length) : 0;
  const overloadedTeachers = teacherLoad.filter(t => t.over).length;

  return { semesterPct, currentWeek: cw, totalWeeks: tw, subjectProgress, teacherLoad, roomUtil, byDay, totalHours, avgRoomUtil, overloadedTeachers };
}
