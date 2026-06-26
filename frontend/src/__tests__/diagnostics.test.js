import { describe, it, expect } from 'vitest';
import { diagnoseFeasibility } from '../lib/diagnostics';

// t-stub: returns the key so we can assert which diagnostics fired.
const t = (key) => key;

const baseRooms = [{ id: 'r1', cap: 100, eve: true }, { id: 'r2', cap: 60, eve: true }];
const baseLecturers = [{ id: 'l1', day: true, eve: true, speciality: null, maxHours: 40 }];

describe('diagnoseFeasibility', () => {
  it('returns no issues for a comfortably feasible week', () => {
    const groups = [{ id: 'g1', name: 'G1', mode: 'day', count: 30, speciality: null, year: 1 }];
    const courses = [{ id: 'c1', code: 'C1', hoursPerWeek: 2, shareable: true, speciality: null }];
    const issues = diagnoseFeasibility({
      courses, lecturers: baseLecturers, rooms: baseRooms, groups,
      institutionType: 'university', numDays: 5, currentWeek: '1', totalWeeks: '35',
    }, t);
    expect(issues).toHaveLength(0);
  });

  it('flags a group needing more sessions than available slots', () => {
    // Day university = 4 slots × 2 days = 8 slots. Demand far exceeds that.
    const groups = [{ id: 'g1', name: 'G1', mode: 'day', count: 30, speciality: null, year: 1 }];
    const courses = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`, code: `C${i}`, hoursPerWeek: 4, shareable: true, speciality: null,
    }));
    const issues = diagnoseFeasibility({
      courses, lecturers: baseLecturers, rooms: baseRooms, groups,
      institutionType: 'university', numDays: 2, currentWeek: '1', totalWeeks: '35',
    }, t);
    expect(issues.some(d => d.message === 'diagGroupOverflow' && d.severity === 'error')).toBe(true);
  });

  it('flags a group larger than the biggest room', () => {
    const groups = [{ id: 'g1', name: 'Big', mode: 'day', count: 500, speciality: null, year: 1 }];
    const courses = [{ id: 'c1', code: 'C1', hoursPerWeek: 2, shareable: true, speciality: null }];
    const issues = diagnoseFeasibility({
      courses, lecturers: baseLecturers, rooms: baseRooms, groups,
      institutionType: 'university', numDays: 5, currentWeek: '1', totalWeeks: '35',
    }, t);
    expect(issues.some(d => d.message === 'diagOversizedGroup' && d.severity === 'error')).toBe(true);
  });
});
