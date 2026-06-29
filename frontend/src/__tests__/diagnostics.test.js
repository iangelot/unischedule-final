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

  it('flags total teaching demand exceeding total teacher capacity', () => {
    // 1 group, 3 courses (≈6 h/week of demand) but a single lecturer capped at
    // 2 h — aggregate capacity is short regardless of slots or rooms.
    const groups = [{ id: 'g1', name: 'G1', mode: 'day', count: 30, speciality: null, year: 1 }];
    const courses = Array.from({ length: 3 }, (_, i) => ({
      id: `c${i}`, code: `C${i}`, hoursPerWeek: 2, shareable: true, speciality: null,
    }));
    const lecturers = [{ id: 'l1', day: true, eve: true, speciality: null, maxHours: 2 }];
    const issues = diagnoseFeasibility({
      courses, lecturers, rooms: baseRooms, groups,
      institutionType: 'university', numDays: 5, currentWeek: '1', totalWeeks: '35',
    }, t);
    expect(issues.some(d => d.message === 'diagCapacity' && d.severity === 'warning')).toBe(true);
  });

  it('does not flag capacity when teachers comfortably cover demand', () => {
    const groups = [{ id: 'g1', name: 'G1', mode: 'day', count: 30, speciality: null, year: 1 }];
    const courses = [{ id: 'c1', code: 'C1', hoursPerWeek: 2, shareable: true, speciality: null }];
    const issues = diagnoseFeasibility({
      courses, lecturers: baseLecturers, rooms: baseRooms, groups,
      institutionType: 'university', numDays: 5, currentWeek: '1', totalWeeks: '35',
    }, t);
    expect(issues.some(d => d.message === 'diagCapacity')).toBe(false);
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
