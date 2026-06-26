// Feasibility diagnostics — explain *why* a week can't be fully scheduled,
// in concrete, actionable terms, BEFORE wasting a generation run.
import { TIME_SLOTS } from '../db';
import { coursesForGroup, lecturersForCourse } from './courseUtils';
import { semesterSessionsForWeek } from './sessionNumbers';

/**
 * Analyze whether the current data can yield a clash-free week.
 * Returns an array of { severity: 'error' | 'warning', message } — `error`
 * means provably impossible, `warning` means very likely to leave conflicts.
 * `t` is the translation function (key, ...args) from useLang.
 */
export function diagnoseFeasibility({ courses, lecturers, rooms, groups, institutionType, numDays, currentWeek, totalWeeks }, t) {
  const issues = [];
  if (!courses.length || !groups.length || !rooms.length) return issues;

  const daySlotCount = (institutionType === 'secondary'
    ? TIME_SLOTS.secondary.filter(s => !s.isBreak)
    : TIME_SLOTS.university.filter(s => !s.isBreak)).length;
  const eveSlotCount = institutionType === 'secondary' ? 0 : TIME_SLOTS.evening.length;

  const dayCap = daySlotCount * numDays;   // teaching slots available per week (day)
  const eveCap = eveSlotCount * numDays;   // teaching slots available per week (evening)

  const dayRooms = rooms.length;
  const eveRooms = rooms.filter(r => r.eve).length;
  const maxDayCap = Math.max(0, ...rooms.map(r => r.cap || 0));
  const maxEveCap = Math.max(0, ...rooms.filter(r => r.eve).map(r => r.cap || 0));

  // Per-lecturer forced load (only sessions that MUST go to one specific teacher).
  const forcedLoad = {};
  let dayDemand = 0, eveDemand = 0;

  groups.forEach(group => {
    const isEve = group.mode === 'evening';
    const slotCap = isEve ? eveCap : dayCap;
    const availLecs = lecturers.filter(l => isEve ? l.eve : l.day);
    const groupCourses = coursesForGroup(group, courses);

    let needed = 0;
    groupCourses.forEach(course => {
      const n = semesterSessionsForWeek(course, currentWeek, totalWeeks).length;
      needed += n;
      // If exactly one qualified lecturer can teach this for the group, it's forced.
      const lecs = lecturersForCourse(course, group, availLecs);
      if (lecs.length === 1) forcedLoad[lecs[0].id] = (forcedLoad[lecs[0].id] || 0) + n;
    });

    if (isEve) eveDemand += needed; else dayDemand += needed;

    // 1. Group needs more sessions than there are time slots for its shift.
    if (needed > slotCap) {
      issues.push({ severity: 'error', message: t('diagGroupOverflow', group.name, needed, slotCap) });
    }

    // 2. Group is bigger than the largest available room for its shift.
    const maxCap = isEve ? maxEveCap : maxDayCap;
    if ((group.count || 0) > maxCap) {
      issues.push({ severity: 'error', message: t('diagOversizedGroup', group.name, group.count, maxCap) });
    }
  });

  // 3. Total room-slot supply vs demand (per shift).
  if (dayDemand > dayRooms * dayCap) {
    issues.push({ severity: 'warning', message: t('diagRoomSupply', t('cDay'), dayDemand, dayRooms * dayCap) });
  }
  if (eveCap > 0 && eveDemand > eveRooms * eveCap) {
    issues.push({ severity: 'warning', message: t('diagRoomSupply', t('cEvening'), eveDemand, eveRooms * eveCap) });
  }

  // 4. A single lecturer is forced into more sessions than slots exist.
  lecturers.forEach(l => {
    const load = forcedLoad[l.id] || 0;
    if (!load) return;
    const cap = (l.day ? dayCap : 0) + (l.eve ? eveCap : 0);
    if (load > cap) {
      issues.push({ severity: 'error', message: t('diagLecOverload', l.name, load, cap) });
    }
  });

  return issues;
}
