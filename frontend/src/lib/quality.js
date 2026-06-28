// Schedule quality score + fairness metrics — pure, read-only analytics over a
// set of sessions. Reused by the Dashboard and the what-if simulator.
const SLOT_HOURS = 2;
const occ = (s) => Array.from({ length: s.durationSlots || 1 }, (_, k) => s.slot + k);

/**
 * @returns {score:0-100, clashes, breakdown:[{key,pct,weight,show}], fairness:{...}} | null
 */
export function computeQuality(sessions, { lecturers = [], rooms = [], groups = [] } = {}) {
  if (!sessions.length) return null;
  const lecMap = Object.fromEntries(lecturers.map(l => [l.id, l]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));

  // ── Hard clashes (group / lecturer / room), block-aware ──
  const seenG = new Set(), seenL = new Set(), seenR = new Set();
  let clashes = 0, roomCells = 0;
  for (const s of sessions) for (const slot of occ(s)) {
    if (s.roomId) { const k = `${s.roomId}-${s.day}-${slot}`; roomCells++; if (seenR.has(k)) clashes++; else seenR.add(k); }
    if (s.lecId)  { const k = `${s.lecId}-${s.day}-${slot}`;  if (seenL.has(k)) clashes++; else seenL.add(k); }
    for (const g of s.groups || []) { const k = `${g}-${s.day}-${slot}`; if (seenG.has(k)) clashes++; else seenG.add(k); }
  }
  const noClashPct = roomCells ? Math.max(0, Math.round((1 - clashes / roomCells) * 100)) : 100;

  // ── Compact days (no idle gaps between a class's lessons) ──
  const groupDay = {};
  sessions.forEach(s => (s.groups || []).forEach(g => {
    const k = `${g}|${s.day}`;
    (groupDay[k] = groupDay[k] || new Set()); occ(s).forEach(sl => groupDay[k].add(sl));
  }));
  let dayCount = 0, gappyDays = 0, totalGaps = 0;
  const classGaps = {};
  Object.entries(groupDay).forEach(([k, set]) => {
    dayCount++;
    if (set.size < 2) return;
    const a = [...set];
    const gaps = (Math.max(...a) - Math.min(...a) + 1) - set.size;
    if (gaps > 0) { gappyDays++; totalGaps += gaps; const g = k.split('|')[0]; classGaps[g] = (classGaps[g] || 0) + gaps; }
  });
  const compactPct = dayCount ? Math.round(((dayCount - gappyDays) / dayCount) * 100) : 100;

  // ── Spread (a subject not stacked several times in one day) ──
  const gcd = {};
  sessions.forEach(s => (s.groups || []).forEach(g => { const k = `${g}|${s.courseId}|${s.day}`; gcd[k] = (gcd[k] || 0) + 1; }));
  const gcVals = Object.values(gcd);
  const stacked = gcVals.filter(c => c > 1).length;
  const spreadPct = gcVals.length ? Math.round(((gcVals.length - stacked) / gcVals.length) * 100) : 100;

  // ── Teacher load within weekly max ──
  const lecSlots = {};
  sessions.forEach(s => { if (s.lecId) lecSlots[s.lecId] = (lecSlots[s.lecId] || 0) + (s.durationSlots || 1); });
  const lecIds = Object.keys(lecSlots);
  const overload = lecIds.filter(id => { const max = lecMap[id]?.maxHours; return max && lecSlots[id] * SLOT_HOURS > max; }).length;
  const loadPct = lecIds.length ? Math.round(((lecIds.length - overload) / lecIds.length) * 100) : 100;

  // ── Room-type match (lab courses in labs) ──
  const typed = sessions.filter(s => s.roomType);
  const typedOk = typed.filter(s => roomMap[s.roomId]?.type === s.roomType).length;
  const roomTypePct = typed.length ? Math.round((typedOk / typed.length) * 100) : 100;

  // ── Teacher availability respected ──
  const withLec = sessions.filter(s => s.lecId);
  const availOk = withLec.filter(s => !(lecMap[s.lecId]?.unavailableDays || []).includes(s.day)).length;
  const availPct = withLec.length ? Math.round((availOk / withLec.length) * 100) : 100;

  const breakdown = [
    { key: 'qNoClash', pct: noClashPct, weight: 0.35, show: true },
    { key: 'qCompact', pct: compactPct, weight: 0.20, show: true },
    { key: 'qSpread', pct: spreadPct, weight: 0.15, show: true },
    { key: 'qLoad', pct: loadPct, weight: 0.10, show: lecIds.length > 0 },
    { key: 'qRoomType', pct: roomTypePct, weight: 0.10, show: typed.length > 0 },
    { key: 'qAvail', pct: availPct, weight: 0.10, show: true },
  ];
  const score = Math.round(breakdown.reduce((a, b) => a + b.pct * b.weight, 0));

  // ── Fairness ──
  const hours = lecIds.map(id => lecSlots[id] * SLOT_HOURS);
  const mean = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
  const std = hours.length ? Math.sqrt(hours.reduce((a, h) => a + (h - mean) ** 2, 0) / hours.length) : 0;
  const balance = mean > 0 ? Math.max(0, Math.round((1 - std / mean) * 100)) : 100;
  const sortedLec = lecIds.map(id => ({ name: lecMap[id]?.name || id, hours: lecSlots[id] * SLOT_HOURS })).sort((a, b) => b.hours - a.hours);
  const worst = Object.entries(classGaps).sort((a, b) => b[1] - a[1])[0];

  return {
    score, clashes, overloaded: overload, breakdown,
    fairness: {
      balance,
      busiest: sortedLec[0] || null,
      lightest: sortedLec[sortedLec.length - 1] || null,
      worstClass: worst ? { name: groupMap[worst[0]]?.name || worst[0], gaps: worst[1] } : null,
      totalGaps,
    },
  };
}
