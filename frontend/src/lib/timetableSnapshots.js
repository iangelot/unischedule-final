import { db } from '../db';
import { formatWeekRange } from './weekConfig';

const MAX_SNAPSHOTS = 50;

function buildLabel({ weekNumber, weekMonday, lang = 'fr' }) {
  const generated = new Date();
  const dateStr = generated.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const weekPart = weekNumber
    ? (lang === 'fr' ? `Semaine ${weekNumber}` : `Week ${weekNumber}`)
    : (lang === 'fr' ? 'Emploi du temps' : 'Timetable');
  return `${weekPart} · ${dateStr}`;
}

export async function saveTimetableSnapshot({ sessions, weekMonday, settings = {}, generatedBy = null, lang = 'fr' }) {
  if (!sessions?.length) return null;

  await db.open();

  const weekNumber = settings.currentWeek || null;
  const numDays = settings._numDays || 7;
  const weekRange = weekMonday
    ? formatWeekRange(new Date(weekMonday), numDays, lang)
    : null;

  try {
    const id = await db.timetableSnapshots.add({
      savedAt: new Date().toISOString(),
      weekMonday: weekMonday ? new Date(weekMonday).toISOString() : null,
      weekNumber,
      weekRange,
      label: buildLabel({ weekNumber, weekMonday, lang }),
      sessionCount: sessions.length,
      generatedBy: generatedBy || null,
      sessions: JSON.parse(JSON.stringify(sessions)),
    });

    const all = await listTimetableSnapshots();
    if (all.length > MAX_SNAPSHOTS) {
      await db.timetableSnapshots.bulkDelete(all.slice(MAX_SNAPSHOTS).map(s => s.id));
    }

    return id;
  } catch (err) {
    console.error('saveTimetableSnapshot failed:', err);
    throw new Error(err?.message || 'Impossible d\'enregistrer dans Historique');
  }
}

export async function listTimetableSnapshots() {
  await db.open();
  const rows = await db.timetableSnapshots.toArray();
  return rows.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export async function getTimetableSnapshot(id) {
  return db.timetableSnapshots.get(Number(id));
}

export async function deleteTimetableSnapshot(id) {
  return db.timetableSnapshots.delete(Number(id));
}

export async function restoreTimetableSnapshot(id) {
  const snap = await getTimetableSnapshot(id);
  if (!snap?.sessions?.length) throw new Error('Archive introuvable ou vide.');
  await db.sessions.clear();
  await db.sessions.bulkAdd(snap.sessions);
  return snap;
}
