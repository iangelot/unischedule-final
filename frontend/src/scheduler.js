// Genetic Algorithm for Timetable Generation
import { TIME_SLOTS } from './db';
import { coursesForGroup, lecturersForCourse } from './lib/courseUtils';
import { semesterSessionsForWeek } from './lib/sessionNumbers';

export function generateTimetable(courses, lecturers, rooms, groups, institutionType = 'university', numDays = 5, weekOptions = {}) {
  const currentWeek = weekOptions.currentWeek ?? '1';
  const totalWeeks = weekOptions.totalWeeks ?? '35';
  if (!courses.length || !groups.length || !rooms.length) return [];

  const POP_SIZE    = 50;
  const GENERATIONS = 150;

  const daySlots = institutionType === 'secondary'
    ? TIME_SLOTS.secondary.filter(s => !s.isBreak)
    : TIME_SLOTS.university.filter(s => !s.isBreak);
  const eveSlots = institutionType === 'secondary' ? [] : TIME_SLOTS.evening;

  const daySlotIndices = daySlots.map((_, i) => i);
  const eveSlotIndices = eveSlots.map((_, i) => daySlots.length + i);

  let population = Array.from({ length: POP_SIZE }, () =>
    randomSchedule(courses, lecturers, rooms, groups, daySlotIndices, eveSlotIndices, numDays, currentWeek, totalWeeks)
  );

  let bestSchedule = null;
  let bestFitness  = -Infinity;

  for (let g = 0; g < GENERATIONS; g++) {
    population.forEach(s => { s.fitness = calculateFitness(s.sessions, rooms, lecturers); });
    population.sort((a, b) => b.fitness - a.fitness);

    if (population[0].fitness > bestFitness) {
      bestFitness  = population[0].fitness;
      bestSchedule = population[0];
    }

    if (bestFitness >= 100) break;

    const newPop = [population[0], population[1]];
    while (newPop.length < POP_SIZE) {
      const p1  = tournamentSelect(population);
      const p2  = tournamentSelect(population);
      let child = crossover(p1, p2);
      if (Math.random() < 0.15) child = mutate(child, rooms, lecturers, daySlotIndices, eveSlotIndices, numDays, currentWeek, totalWeeks);
      newPop.push(child);
    }
    population = newPop;
  }

  return bestSchedule ? bestSchedule.sessions : [];
}

function randomSchedule(courses, lecturers, rooms, groups, daySlotIndices, eveSlotIndices, numDays = 5, currentWeek = '1', totalWeeks = '35') {
  const sessions = [];

  groups.forEach(group => {
    const isEvening = group.mode === 'evening';
    const availSlots = isEvening ? eveSlotIndices : daySlotIndices;
    if (availSlots.length === 0) return;

    const groupCourses = coursesForGroup(group, courses);
    if (groupCourses.length === 0) return;

    const availLecs  = lecturers.filter(l => isEvening ? l.eve : l.day);
    const availRooms = rooms.filter(r => isEvening ? r.eve : true);
    if (availLecs.length === 0 || availRooms.length === 0) return;

    groupCourses.forEach(course => {
      const courseLecs = lecturersForCourse(course, group, availLecs);
      if (courseLecs.length === 0) return;

      const weekSlots = semesterSessionsForWeek(course, currentWeek, totalWeeks);

      weekSlots.forEach((meta, n) => {
        const lec  = courseLecs[Math.floor(Math.random() * courseLecs.length)];
        const room = availRooms.find(r => r.cap >= (group.count || 30)) || availRooms[0];
        const day  = Math.floor(Math.random() * numDays);
        const slot = availSlots[Math.floor(Math.random() * availSlots.length)];

        sessions.push({
          id:       `${group.id}_${course.id}_w${currentWeek}_s${meta.semesterSessionNum}_${Math.random().toString(36).slice(2, 6)}`,
          courseId: course.id,
          lecId:    lec?.id,
          roomId:   room?.id,
          day,
          slot,
          groups:  [group.id],
          mode:    group.mode || 'day',
          locked:  false,
          sessionNum: meta.semesterSessionNum,
          totalSessions: meta.totalSemesterSessions,
          sessionInWeek: meta.sessionInWeek,
          sessionsPerWeek: meta.sessionsPerWeek,
        });
      });
    });
  });

  return { sessions, fitness: 0 };
}

function calculateFitness(sessions, rooms, lecturers) {
  let score = 100;
  const HARD_PENALTY = 20;
  const SOFT_PENALTY = 5;

  const slotIndex = {};
  sessions.forEach(s => {
    const key = `${s.day}-${s.slot}`;
    if (!slotIndex[key]) slotIndex[key] = [];
    slotIndex[key].push(s);
  });

  const roomMap = Object.fromEntries((rooms || []).map(r => [r.id, r]));

  Object.values(slotIndex).forEach(slotSessions => {
    const lecCount = {};
    slotSessions.forEach(s => {
      if (s.lecId) lecCount[s.lecId] = (lecCount[s.lecId] || 0) + 1;
    });
    Object.values(lecCount).forEach(c => { if (c > 1) score -= HARD_PENALTY * (c - 1); });

    const roomCount = {};
    slotSessions.forEach(s => {
      if (s.roomId) roomCount[s.roomId] = (roomCount[s.roomId] || 0) + 1;
    });
    Object.values(roomCount).forEach(c => { if (c > 1) score -= HARD_PENALTY * (c - 1); });

    const groupCount = {};
    slotSessions.forEach(s => {
      (s.groups || []).forEach(gid => {
        groupCount[gid] = (groupCount[gid] || 0) + 1;
      });
    });
    Object.values(groupCount).forEach(c => { if (c > 1) score -= HARD_PENALTY * (c - 1); });

    slotSessions.forEach(s => {
      const room = roomMap[s.roomId];
      if (room && s.groupSize && s.groupSize > room.cap) score -= HARD_PENALTY;
    });
  });

  const lecDayEve = {};
  sessions.forEach(s => {
    if (!s.lecId) return;
    const key = `${s.lecId}-${s.day}`;
    if (!lecDayEve[key]) lecDayEve[key] = new Set();
    lecDayEve[key].add(s.mode);
  });
  Object.values(lecDayEve).forEach(modes => {
    if (modes.has('day') && modes.has('evening')) score -= SOFT_PENALTY;
  });

  return Math.max(0, score);
}

function tournamentSelect(population) {
  const candidates = Array.from({ length: 3 }, () =>
    population[Math.floor(Math.random() * population.length)]
  );
  return candidates.reduce((best, c) => c.fitness > best.fitness ? c : best);
}

function crossover(p1, p2) {
  const mid = Math.floor(p1.sessions.length / 2);
  return {
    sessions: [
      ...p1.sessions.slice(0, mid).map(s => ({ ...s })),
      ...p2.sessions.slice(mid).map(s => ({ ...s })),
    ],
    fitness: 0,
  };
}

function mutate(schedule, rooms, lecturers, daySlotIndices, eveSlotIndices, numDays = 5, _currentWeek = '1', _totalWeeks = '35') {
  if (!schedule.sessions.length) return schedule;
  const copy = { ...schedule, sessions: schedule.sessions.map(s => ({ ...s })) };
  const mutable = copy.sessions.filter(s => !s.locked);
  if (!mutable.length) return copy;

  const s    = mutable[Math.floor(Math.random() * mutable.length)];
  const roll = Math.random();
  const availSlots = s.mode === 'evening' ? eveSlotIndices : daySlotIndices;

  if (roll < 0.33 && availSlots.length) {
    s.day  = Math.floor(Math.random() * numDays);
    s.slot = availSlots[Math.floor(Math.random() * availSlots.length)];
  } else if (roll < 0.66) {
    const candidates = rooms.filter(r => s.mode === 'evening' ? r.eve : true);
    if (candidates.length) s.roomId = candidates[Math.floor(Math.random() * candidates.length)].id;
  } else {
    const candidates = lecturers.filter(l => s.mode === 'evening' ? l.eve : l.day);
    if (candidates.length) s.lecId = candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  return copy;
}
