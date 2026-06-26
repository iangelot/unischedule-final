// Genetic Algorithm for Timetable Generation
import { TIME_SLOTS } from './db';
import { coursesForGroup, lecturersForCourse } from './lib/courseUtils';
import { semesterSessionsForWeek } from './lib/sessionNumbers';

// ── Block (multi-slot) session helpers ───────────────────────────
// A session may span several consecutive 2h slots (e.g. a 4h block = 2 slots).

/** Slot indices a session occupies: [slot, slot+1, …] for its durationSlots. */
function occupiedSlots(s) {
  const d = s.durationSlots || 1;
  const out = [];
  for (let k = 0; k < d; k++) out.push(s.slot + k);
  return out;
}

/**
 * Valid starting slot indices where `durationSlots` consecutive slots are all
 * within `slotIndices` AND time-contiguous (each slot's end === next's start —
 * so a block never jumps the lunch break or the day→evening gap).
 */
function validBlockStarts(durationSlots, slotIndices, allSlotDefs) {
  if (durationSlots <= 1) return slotIndices;
  const set = new Set(slotIndices);
  const starts = [];
  for (const s of slotIndices) {
    let ok = true;
    for (let k = 0; k < durationSlots - 1; k++) {
      const a = allSlotDefs[s + k], b = allSlotDefs[s + k + 1];
      if (!set.has(s + k + 1) || !a || !b || a.end !== b.start) { ok = false; break; }
    }
    if (ok) starts.push(s);
  }
  return starts;
}

/** Pick a placement (start slot) for a session of the given duration. */
function pickStart(durationSlots, slotIndices, allSlotDefs) {
  const starts = validBlockStarts(durationSlots, slotIndices, allSlotDefs);
  const pool = starts.length ? starts : slotIndices; // degrade gracefully if a block can't fit
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateTimetable(courses, lecturers, rooms, groups, institutionType = 'university', numDays = 5, weekOptions = {}) {
  const currentWeek = weekOptions.currentWeek ?? '1';
  const totalWeeks = weekOptions.totalWeeks ?? '35';
  const makeups = weekOptions.makeups ?? [];   // pending makeup sessions to fold into this week
  if (!courses.length || !groups.length || !rooms.length) return [];

  const POP_SIZE    = 50;
  const GENERATIONS = 300;

  // Day indices (0 = Monday) that fall on a public holiday this week — avoid them.
  const holidaySet  = new Set(weekOptions.holidayDays ?? []);
  const allDays     = Array.from({ length: numDays }, (_, i) => i);
  const allowedDays = allDays.filter(d => !holidaySet.has(d));
  // If the entire week is a holiday there is nowhere to place sessions; fall
  // back to all days so generation still produces a (penalized) result.
  const schedulableDays = allowedDays.length ? allowedDays : allDays;

  const daySlots = institutionType === 'secondary'
    ? TIME_SLOTS.secondary.filter(s => !s.isBreak)
    : TIME_SLOTS.university.filter(s => !s.isBreak);
  const eveSlots = institutionType === 'secondary' ? [] : TIME_SLOTS.evening;

  const daySlotIndices = daySlots.map((_, i) => i);
  const eveSlotIndices = eveSlots.map((_, i) => daySlots.length + i);
  // Combined slot definitions indexed by slot index — used to validate that a
  // multi-slot block occupies time-contiguous slots (no spanning the lunch break).
  const allSlotDefs = [...daySlots, ...eveSlots];

  let population = Array.from({ length: POP_SIZE }, () =>
    randomSchedule(courses, lecturers, rooms, groups, daySlotIndices, eveSlotIndices, schedulableDays, currentWeek, totalWeeks, makeups, allSlotDefs)
  );

  let bestSchedule = null;
  let bestFitness  = -Infinity;

  for (let g = 0; g < GENERATIONS; g++) {
    population.forEach(s => { s.fitness = calculateFitness(s.sessions, rooms, lecturers, holidaySet); });
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
      // Mutate most children (the two elites above are preserved unchanged).
      if (Math.random() < 0.85) child = mutate(child, rooms, lecturers, daySlotIndices, eveSlotIndices, schedulableDays, allSlotDefs);
      newPop.push(child);
    }
    population = newPop;
  }

  if (!bestSchedule) return [];
  // Deterministic repair: the GA gets close but isn't guaranteed conflict-free.
  // This pass relocates any session still clashing (group / lecturer / room) to
  // a slot that is free on all three axes, so the result is reliably postable.
  return repairSchedule(bestSchedule.sessions, daySlotIndices, eveSlotIndices, schedulableDays, rooms, allSlotDefs);
}

function repairSchedule(sessions, daySlotIndices, eveSlotIndices, schedulableDays, rooms, allSlotDefs = []) {
  const key = (a, b, c) => `${a}-${b}-${c}`;
  // Occupancy COUNTS per cell. A block session occupies EVERY slot it spans, so
  // each session is expanded via occupiedSlots — this is what keeps a 4h block
  // from colliding with a 2h class in its second hour.
  const groupAt = new Map(); // `${gid}-${day}-${slot}` -> count
  const lecAt   = new Map(); // `${lecId}-${day}-${slot}` -> count
  const roomAt  = new Map(); // `${roomId}-${day}-${slot}` -> count

  const bump = (map, k, d) => {
    const next = (map.get(k) || 0) + d;
    if (next <= 0) map.delete(k); else map.set(k, next);
  };
  const apply = (s, d) => {
    occupiedSlots(s).forEach(slot => {
      (s.groups || []).forEach(g => bump(groupAt, key(g, s.day, slot), d));
      if (s.lecId)  bump(lecAt, key(s.lecId, s.day, slot), d);
      if (s.roomId) bump(roomAt, key(s.roomId, s.day, slot), d);
    });
  };
  const add    = (s) => apply(s, +1);
  const remove = (s) => apply(s, -1);
  // Are ALL slots a session of this duration would occupy, starting at
  // (day, startSlot) in roomId, free on all three axes?
  const freeAt = (s, day, startSlot, roomId) => {
    const dur = s.durationSlots || 1;
    for (let k = 0; k < dur; k++) {
      const slot = startSlot + k;
      if ((s.groups || []).some(g => groupAt.get(key(g, day, slot)))) return false;
      if (s.lecId && lecAt.get(key(s.lecId, day, slot))) return false;
      if (roomId && roomAt.get(key(roomId, day, slot))) return false;
    }
    return true;
  };
  // With this session lifted out, does any cell it occupies still clash?
  const conflicted = (s) => {
    remove(s);
    let bad = false;
    for (const slot of occupiedSlots(s)) {
      if ((s.groups || []).some(g => groupAt.get(key(g, s.day, slot))) ||
          (s.lecId && lecAt.get(key(s.lecId, s.day, slot))) ||
          (s.roomId && roomAt.get(key(s.roomId, s.day, slot)))) { bad = true; break; }
    }
    add(s);
    return bad;
  };

  sessions.forEach(add);

  for (let pass = 0; pass < 4; pass++) {
    let moved = 0;
    for (const s of sessions) {
      if (s.locked || !conflicted(s)) continue;
      remove(s);
      const slots = s.mode === 'evening' ? eveSlotIndices : daySlotIndices;
      const starts = validBlockStarts(s.durationSlots || 1, slots, allSlotDefs);
      const startPool = starts.length ? starts : slots;
      const allowed = rooms.filter(r => (s.mode === 'evening' ? r.eve : true));
      const fitting = allowed.filter(r => !s.groupSize || r.cap >= s.groupSize);
      const pool = fitting.length ? fitting : allowed;
      let placed = false;
      for (const day of schedulableDays) {
        for (const slot of startPool) {
          for (const room of pool) {
            if (freeAt(s, day, slot, room.id)) {
              s.day = day; s.slot = slot; s.roomId = room.id;
              placed = true; moved++; break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }
      add(s); // re-register at the new (or unchanged, if no free cell) position
    }
    if (!moved) break;
  }

  return sessions;
}

function randomSchedule(courses, lecturers, rooms, groups, daySlotIndices, eveSlotIndices, schedulableDays = [0, 1, 2, 3, 4], currentWeek = '1', totalWeeks = '35', makeups = [], allSlotDefs = []) {
  const sessions = [];
  const pickRoom = (availRooms, size) => {
    const fitting = availRooms.filter(r => r.cap >= size);
    const pool = fitting.length ? fitting : availRooms;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const randDay = () => schedulableDays[Math.floor(Math.random() * schedulableDays.length)];

  groups.forEach(group => {
    const isEvening = group.mode === 'evening';
    const availSlots = isEvening ? eveSlotIndices : daySlotIndices;
    if (availSlots.length === 0) return;

    const groupCourses = coursesForGroup(group, courses);
    const availLecs  = lecturers.filter(l => isEvening ? l.eve : l.day);
    const availRooms = rooms.filter(r => isEvening ? r.eve : true);
    if (availLecs.length === 0 || availRooms.length === 0) return;
    const groupSize = group.count || 30;

    // Fold in any makeup ("rattrapage") sessions owed to this group — extra
    // sessions on top of the normal week, placed/optimized like the rest.
    makeups.filter(m => m.groupId === group.id).forEach(m => {
      const lec = availLecs.find(l => l.id === m.lecId) || availLecs[Math.floor(Math.random() * availLecs.length)];
      const room = pickRoom(availRooms, groupSize);
      sessions.push({
        id:       `makeup_${m.id}_${Math.random().toString(36).slice(2, 6)}`,
        courseId: m.courseId,
        lecId:    lec?.id,
        roomId:   room?.id,
        day:      randDay(),
        slot:     availSlots[Math.floor(Math.random() * availSlots.length)],
        groups:   [group.id],
        groupSize,
        mode:     group.mode || 'day',
        locked:   false,
        isMakeup: true,
        makeupId: m.id,
        sessionNum: m.sessionNum,
        totalSessions: m.totalSessions,
      });
    });

    if (groupCourses.length === 0) return;

    groupCourses.forEach(course => {
      const courseLecs = lecturersForCourse(course, group, availLecs);
      if (courseLecs.length === 0) return;

      const weekSlots = semesterSessionsForWeek(course, currentWeek, totalWeeks);

      weekSlots.forEach((meta) => {
        const lec  = courseLecs[Math.floor(Math.random() * courseLecs.length)];
        // Randomize among rooms that fit the group (not the first match) so the
        // population explores room assignments instead of all piling into Amphi 500.
        const room = pickRoom(availRooms, groupSize);
        const day  = randDay();
        const dur  = meta.durationSlots || 1;
        const slot = pickStart(dur, availSlots, allSlotDefs); // valid contiguous start for blocks

        sessions.push({
          id:       `${group.id}_${course.id}_w${currentWeek}_s${meta.semesterSessionNum}_${Math.random().toString(36).slice(2, 6)}`,
          courseId: course.id,
          lecId:    lec?.id,
          roomId:   room?.id,
          day,
          slot,
          durationSlots: dur,
          groups:  [group.id],
          groupSize,
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

function calculateFitness(sessions, rooms, lecturers, holidaySet = new Set()) {
  let score = 100;
  const HARD_PENALTY = 20;
  const SOFT_PENALTY = 5;

  // Hard constraint: nothing may be scheduled on a public holiday.
  if (holidaySet.size) {
    sessions.forEach(s => { if (holidaySet.has(s.day)) score -= HARD_PENALTY; });
  }

  // Index each session under EVERY slot it occupies (a block spans several),
  // so clashes are detected in any hour of a block, not just its first.
  const slotIndex = {};
  sessions.forEach(s => {
    occupiedSlots(s).forEach(slot => {
      const key = `${s.day}-${slot}`;
      if (!slotIndex[key]) slotIndex[key] = [];
      slotIndex[key].push(s);
    });
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

  // Lecturer weekly load — penalize teaching beyond maxHours.
  // Each session block is ~2 hours, so weekly hours ≈ sessionCount * 2.
  const SLOT_HOURS = 2;
  const lecMap = Object.fromEntries((lecturers || []).map(l => [l.id, l]));
  const lecSessionCount = {};
  sessions.forEach(s => {
    if (s.lecId) lecSessionCount[s.lecId] = (lecSessionCount[s.lecId] || 0) + occupiedSlots(s).length;
  });
  Object.entries(lecSessionCount).forEach(([lecId, slots]) => {
    const max = lecMap[lecId]?.maxHours;
    if (!max) return;
    const hours = slots * SLOT_HOURS;
    if (hours > max) score -= SOFT_PENALTY * (hours - max);
  });

  // Soft: compact days — penalize idle gaps between a group's classes on the
  // same day (e.g. class, free, class). Slot indices are contiguous within a
  // mode, so a gap is any empty slot wedged between the first and last class.
  const GAP_PENALTY = 3;
  const groupDaySlots = {};
  sessions.forEach(s => {
    (s.groups || []).forEach(gid => {
      const key = `${gid}-${s.day}`;
      if (!groupDaySlots[key]) groupDaySlots[key] = new Set();
      occupiedSlots(s).forEach(slot => groupDaySlots[key].add(slot));
    });
  });
  Object.values(groupDaySlots).forEach(slotSet => {
    if (slotSet.size < 2) return;
    const slots = [...slotSet];
    const span = Math.max(...slots) - Math.min(...slots) + 1;
    const gaps = span - slotSet.size;
    if (gaps > 0) score -= GAP_PENALTY * gaps;
  });

  // Soft: spread a course's weekly sessions across different days for a group
  // (avoid stacking the same subject several times in one day).
  const groupCourseDay = {};
  sessions.forEach(s => {
    if (!s.courseId) return;
    (s.groups || []).forEach(gid => {
      const key = `${gid}-${s.courseId}-${s.day}`;
      groupCourseDay[key] = (groupCourseDay[key] || 0) + 1;
    });
  });
  Object.values(groupCourseDay).forEach(c => { if (c > 1) score -= SOFT_PENALTY * (c - 1); });

  // Do NOT floor at 0 — a floor flattens the gradient across all heavily-
  // conflicted schedules (they'd all tie), so the GA can't tell "27 clashes"
  // from "3 clashes" and stops improving. Raw (possibly negative) score keeps
  // selection pressure pushing toward fewer conflicts. 100 = a perfect week.
  return score;
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

function mutate(schedule, rooms, lecturers, daySlotIndices, eveSlotIndices, schedulableDays = [0, 1, 2, 3, 4], allSlotDefs = []) {
  if (!schedule.sessions.length) return schedule;
  const copy = { ...schedule, sessions: schedule.sessions.map(s => ({ ...s })) };
  const mutable = copy.sessions.filter(s => !s.locked);
  if (!mutable.length) return copy;

  // Perturb several sessions per call (~8% of the week, at least one). A single
  // tweak per child is far too weak to untangle a 100+ session schedule.
  const count = Math.max(1, Math.round(mutable.length * 0.08));
  for (let i = 0; i < count; i++) {
    const s    = mutable[Math.floor(Math.random() * mutable.length)];
    const roll = Math.random();
    const availSlots = s.mode === 'evening' ? eveSlotIndices : daySlotIndices;

    if (roll < 0.4 && availSlots.length) {
      s.day  = schedulableDays[Math.floor(Math.random() * schedulableDays.length)];
      s.slot = pickStart(s.durationSlots || 1, availSlots, allSlotDefs); // keep blocks contiguous
    } else if (roll < 0.7) {
      // Prefer rooms that fit the group, falling back to any allowed room.
      const allowed = rooms.filter(r => s.mode === 'evening' ? r.eve : true);
      const fitting = allowed.filter(r => !s.groupSize || r.cap >= s.groupSize);
      const pool = fitting.length ? fitting : allowed;
      if (pool.length) s.roomId = pool[Math.floor(Math.random() * pool.length)].id;
    } else {
      const candidates = lecturers.filter(l => s.mode === 'evening' ? l.eve : l.day);
      if (candidates.length) s.lecId = candidates[Math.floor(Math.random() * candidates.length)].id;
    }
  }

  return copy;
}
