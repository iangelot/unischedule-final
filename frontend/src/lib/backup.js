import { db } from '../db';

const TABLES = ['courses', 'lecturers', 'rooms', 'groups', 'sessions', 'exams', 'holidays', 'settings', 'users'];

export async function exportBackup() {
  const data = { version: 2, exportedAt: new Date().toISOString(), tables: {} };
  for (const table of TABLES) {
    data.tables[table] = await db[table].toArray();
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unischedule-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.tables) throw new Error('Fichier de sauvegarde invalide.');

  await db.transaction('rw', TABLES.map(t => db[t]), async () => {
    for (const table of TABLES) {
      if (data.tables[table]) {
        await db[table].clear();
        if (data.tables[table].length > 0) {
          await db[table].bulkAdd(data.tables[table]);
        }
      }
    }
  });
}
