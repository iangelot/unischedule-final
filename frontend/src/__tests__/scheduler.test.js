import { describe, it, expect } from 'vitest';
import { generateTimetable } from '../scheduler';

// Minimal, self-contained dataset (offline model — no DB needed).
const groups = [
  { id: 'g1', name: 'G1', mode: 'day', count: 30, speciality: null },
  { id: 'g2', name: 'G2', mode: 'day', count: 30, speciality: null },
];
const lecturers = [
  { id: 'l1', day: true, eve: false, speciality: null, maxHours: 40 },
  { id: 'l2', day: true, eve: false, speciality: null, maxHours: 40 },
];
const rooms = [
  { id: 'r1', cap: 100, eve: true },
  { id: 'r2', cap: 100, eve: true },
];
const courses = [
  { id: 'c1', code: 'C1', name_fr: 'Cours 1', hoursPerWeek: 3, shareable: true, speciality: null },
  { id: 'c2', code: 'C2', name_fr: 'Cours 2', hoursPerWeek: 2, shareable: true, speciality: null },
];

describe('generateTimetable', () => {
  it('produces sessions for the seeded groups', () => {
    const sessions = generateTimetable(courses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35',
    });
    expect(sessions.length).toBeGreaterThan(0);
  });

  it('never places two of a group\'s classes in the same day+slot', () => {
    const sessions = generateTimetable(courses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35',
    });
    const seen = new Set();
    for (const s of sessions) {
      for (const gid of s.groups || []) {
        const key = `${gid}-${s.day}-${s.slot}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('never schedules on a holiday day', () => {
    // Monday (day index 0) is a public holiday this week.
    const sessions = generateTimetable(courses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35', holidayDays: [0],
    });
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every(s => s.day !== 0)).toBe(true);
  });

  it('tags each session with its group size (room-capacity constraint)', () => {
    const sessions = generateTimetable(courses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35',
    });
    expect(sessions.every(s => typeof s.groupSize === 'number')).toBe(true);
  });
});

describe('generateTimetable — block (multi-slot) courses', () => {
  const blockCourses = [
    { id: 'cb', code: 'LAB', name_fr: 'Labo', hoursPerWeek: 4, block: true, shareable: true, speciality: null },
    { id: 'c2', code: 'C2', name_fr: 'Cours 2', hoursPerWeek: 2, shareable: true, speciality: null },
  ];
  const occ = (s) => Array.from({ length: s.durationSlots || 1 }, (_, k) => s.slot + k);

  it('delivers a 4h block course as one 2-slot session', () => {
    const sessions = generateTimetable(blockCourses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35',
    });
    const blocks = sessions.filter(s => s.courseId === 'cb');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every(s => s.durationSlots === 2)).toBe(true);
  });

  it('never overlaps occupancy — even counting every slot a block spans', () => {
    const sessions = generateTimetable(blockCourses, lecturers, rooms, groups, 'university', 5, {
      currentWeek: '1', totalWeeks: '35',
    });
    const gSeen = new Set(), lSeen = new Set(), rSeen = new Set();
    let gClash = 0, lClash = 0, rClash = 0;
    for (const s of sessions) {
      for (const slot of occ(s)) {
        for (const g of s.groups || []) { const k = `${g}-${s.day}-${slot}`; if (gSeen.has(k)) gClash++; gSeen.add(k); }
        if (s.lecId)  { const k = `${s.lecId}-${s.day}-${slot}`;  if (lSeen.has(k)) lClash++; lSeen.add(k); }
        if (s.roomId) { const k = `${s.roomId}-${s.day}-${slot}`; if (rSeen.has(k)) rClash++; rSeen.add(k); }
      }
    }
    expect({ gClash, lClash, rClash }).toEqual({ gClash: 0, lClash: 0, rClash: 0 });
  });
});
