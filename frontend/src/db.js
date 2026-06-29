import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('UniScheduleDB');

// 2. Define the Schema (version bumped to 2 to add holidays + settings)
db.version(1).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status',
  exams:     'id, courseId, date, roomId',
  syncQueue: '++id, action, type, timestamp',
});

db.version(2).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode, speciality',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status, locked',
  exams:     'id, courseId, date, roomId',
  syncQueue: '++id, action, type, timestamp',
  holidays:  'id, date, type',
  settings:  'key',
});

db.version(3).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode, speciality',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status, locked',
  exams:     'id, courseId, date, roomId',
  holidays:  'id, date, type',
  settings:  'key',
  users:     'id, email, role',
});

db.version(4).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode, speciality',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status, locked',
  exams:     'id, courseId, date, roomId',
  holidays:  'id, date, type',
  settings:  'key',
  users:     'id, email, role',
  timetableSnapshots: '++id, savedAt, weekMonday',
});

db.version(5).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode, speciality',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status, locked',
  exams:     'id, courseId, date, roomId',
  holidays:  'id, date, type',
  settings:  'key',
  users:     'id, email, role',
  timetableSnapshots: '++id, savedAt, weekMonday',
});

// v6: makeup backlog — missed sessions a teacher will recover ("rattrapage").
// Persists outside `sessions` (which is wiped on every generation) so a makeup
// survives regeneration and is re-injected into a later week until delivered.
db.version(6).stores({
  courses:   'id, code, shareable',
  lecturers: 'id, type, day, eve',
  rooms:     'id, cap, eve, type',
  groups:    'id, mode, speciality',
  sessions:  'id, courseId, lecId, roomId, day, slot, mode, status, locked',
  exams:     'id, courseId, date, roomId',
  holidays:  'id, date, type',
  settings:  'key',
  users:     'id, email, role',
  timetableSnapshots: '++id, savedAt, weekMonday',
  makeups:   '++id, courseId, groupId, status',
});

export { CAMEROON_SPECIALITIES, specialityMatches } from './lib/cameroonSpecialities';

// Cameroon public holidays (fixed + observed annually)
export const CAMEROON_HOLIDAYS = [
  { id: 'h_ny',   name_fr: 'Jour de l\'An',           name_en: 'New Year\'s Day',       month: 1,  day: 1,  type: 'national' },
  { id: 'h_yth',  name_fr: 'Fête de la Jeunesse',      name_en: 'Youth Day',             month: 2,  day: 11, type: 'national' },
  { id: 'h_lab',  name_fr: 'Fête du Travail',           name_en: 'Labour Day',            month: 5,  day: 1,  type: 'national' },
  { id: 'h_nat',  name_fr: 'Fête Nationale',            name_en: 'National Day',          month: 5,  day: 20, type: 'national' },
  { id: 'h_ass',  name_fr: 'Fête de l\'Assomption',     name_en: 'Assumption Day',        month: 8,  day: 15, type: 'national' },
  { id: 'h_xmas', name_fr: 'Noël',                      name_en: 'Christmas Day',         month: 12, day: 25, type: 'national' },
  { id: 'h_eid1', name_fr: 'Aïd El-Fitr (observé)',     name_en: 'Eid Al-Fitr (observed)',month: 0,  day: 0,  type: 'religious', variable: true },
  { id: 'h_eid2', name_fr: 'Aïd El-Adha (observé)',     name_en: 'Eid Al-Adha (observed)',month: 0,  day: 0,  type: 'religious', variable: true },
  { id: 'h_gf',   name_fr: 'Vendredi Saint',            name_en: 'Good Friday',           month: 0,  day: 0,  type: 'religious', variable: true },
  { id: 'h_asc',  name_fr: 'Ascension',                 name_en: 'Ascension Day',         month: 0,  day: 0,  type: 'religious', variable: true },
];

// ── Time slot definitions per institution type ──────────────────
// Matches real IUGET/South Polytech format (Douala, Cameroon)

export const TIME_SLOTS = {
  secondary: [
    { label: '08:00 – 10:00', start: '08:00', end: '10:00', isSat: false },
    { label: '10:00 – 12:00', start: '10:00', end: '12:00', isSat: false },
    { label: '12:00 – 14:00', start: '12:00', end: '14:00', isBreak: true, isSat: false },
    { label: '14:00 – 16:00', start: '14:00', end: '16:00', isSat: false },
  ],
  university: [
    { label: '08:00 – 10:00', start: '08:00', end: '10:00', isSat: false },
    { label: '10:00 – 12:00', start: '10:00', end: '12:00', isSat: false },
    { label: '12:00 – 13:00', start: '12:00', end: '13:00', isBreak: true, isSat: false },
    { label: '13:00 – 15:00', start: '13:00', end: '15:00', isSat: false },
    { label: '15:00 – 17:00', start: '15:00', end: '17:00', isSat: false },
  ],
  // Weekday evening slots (B.TECH / evening programs): 06pm-08pm, 08pm-10pm
  evening: [
    { label: '18:00 – 20:00', start: '18:00', end: '20:00', isSat: false },
    { label: '20:00 – 22:00', start: '20:00', end: '22:00', isSat: false },
  ],
  // Saturday uses 4-hour blocks (as seen on IUGET timetables)
  saturday: [
    { label: '08:00 – 12:00', start: '08:00', end: '12:00', isSat: true },
    { label: '13:00 – 17:00', start: '13:00', end: '17:00', isSat: true },
  ],
};

// Returns combined slots for a given institution type
export function getSlotsForType(institutionType) {
  if (institutionType === 'secondary') {
    return TIME_SLOTS.secondary;
  }
  // university: day slots + evening slots (indexed as 5,6)
  return [...TIME_SLOTS.university, ...TIME_SLOTS.evening];
}

// 3. Database Initializer (Seeder)
// Memoized so concurrent callers (e.g. React StrictMode invoking the init
// effect twice) share one run and can't double-seed into a key collision.
let initPromise = null;
export function initializeDatabase() {
  if (!initPromise) initPromise = runInitialization();
  return initPromise;
}

async function runInitialization() {
  await db.open();
  const groupsCount = await db.groups.count();

  if (groupsCount === 0) {
    console.log('Database empty. Seeding Cameroon initial data...');
    await seedCameroonData();
    console.log('Database seeded successfully!');
  } else {
    await migrateEnglishSpecialitiesToFrench();
    await migrateShareableConsistency();
  }

  // Always ensure default settings exist
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.bulkPut([
      { key: 'institutionName',  value: 'Mon Établissement' },
      { key: 'schoolName',       value: '' },          // e.g. South Polytech
      { key: 'institutionType',  value: 'university' },
      { key: 'slug',             value: 'mon-etablissement' },
      { key: 'logo',             value: null },
      { key: 'logo2',            value: null },         // second logo (side logo)
      { key: 'showSaturday',     value: true },
      { key: 'showSunday',       value: true },
      { key: 'language',         value: 'fr' },
      { key: 'weekStart',        value: null },
      { key: 'currentWeek',      value: '1' },          // e.g. 33
      { key: 'totalWeeks',       value: '35' },         // e.g. 35
      { key: 'semester',         value: '' },           // e.g. Sixth Semester
      { key: 'cohort',           value: '' },           // e.g. B.TECH BONABERI
      { key: 'city',             value: 'Douala' },
      { key: 'directorTitle',    value: 'Le Directeur' },
      { key: 'directorName',     value: '' },
      { key: 'refPrefix',        value: '' },           // e.g. IUGET/C-BHI/P-SP
    ]);
  }
}

/** Upgrade old English filière labels → French (Cameroun). */
async function migrateEnglishSpecialitiesToFrench() {
  const { CAMEROON_SPECIALITIES: specs } = await import('./lib/cameroonSpecialities');
  const aliasToFrench = {};
  for (const [french, meta] of Object.entries(specs)) {
    for (const alias of meta.aliases || []) aliasToFrench[alias] = french;
  }
  const resolve = (val) => aliasToFrench[val] || val;

  const courses = await db.courses.toArray();
  for (const c of courses) {
    const next = resolve(c.speciality);
    if (next !== c.speciality) await db.courses.update(c.id, { speciality: next });
  }
  const lecturers = await db.lecturers.toArray();
  for (const l of lecturers) {
    const next = resolve(l.speciality);
    if (next !== l.speciality) await db.lecturers.update(l.id, { speciality: next });
  }
}

/**
 * Enforce the app's own invariant: a "shareable" (general) course has no
 * speciality. A course that carries a speciality but is also flagged shareable
 * leaks into every group's timetable (e.g. CRY102 showing for all groups).
 * Fix legacy data by un-sharing any speciality-bearing course.
 */
async function migrateShareableConsistency() {
  const courses = await db.courses.toArray();
  for (const c of courses) {
    if (c.shareable && c.speciality) {
      await db.courses.update(c.id, { shareable: false });
    }
  }
}

async function seedCameroonData() {
  // Groups: GL (Software), RT (Networking), GD (Graphic Design), CF (Accounting)
  await db.groups.bulkAdd([
    { id: 'g_gl3a', name: 'GL-3A',   count: 45, mode: 'day',     speciality: 'Génie Logiciel (GL)',           year: 3, code: 'GL' },
    { id: 'g_gl3b', name: 'GL-3B',   count: 42, mode: 'day',     speciality: 'Génie Logiciel (GL)',           year: 3, code: 'GL' },
    { id: 'g_gl3e', name: 'GL-SOIR', count: 55, mode: 'evening', speciality: 'Génie Logiciel (GL)',           year: 3, code: 'GL' },
    { id: 'g_rt2a', name: 'RT-2A',   count: 38, mode: 'day',     speciality: 'Réseaux & Télécoms (RT)',       year: 2, code: 'RT' },
    { id: 'g_rt2b', name: 'RT-2B',   count: 36, mode: 'day',     speciality: 'Réseaux & Télécoms (RT)',       year: 2, code: 'RT' },
    { id: 'g_rt2e', name: 'RT-SOIR', count: 48, mode: 'evening', speciality: 'Réseaux & Télécoms (RT)',       year: 2, code: 'RT' },
    { id: 'g_gd1a', name: 'GD-1A',   count: 30, mode: 'day',     speciality: 'Design Graphique (GD)',         year: 1, code: 'GD' },
    { id: 'g_cf2a', name: 'CF-2A',   count: 50, mode: 'day',     speciality: 'Comptabilité & Finance (CF)',   year: 2, code: 'CF' },
    { id: 'g_cf2e', name: 'CF-SOIR', count: 60, mode: 'evening', speciality: 'Comptabilité & Finance (CF)',   year: 2, code: 'CF' },
    { id: 'g_cs1a', name: 'CS-1A',   count: 35, mode: 'day',     speciality: 'Sécurité des Systèmes (SSI)',   year: 1, code: 'SSI' },
  ]);

  await db.lecturers.bulkAdd([
    // Génie Logiciel (GL) — 3 groups incl. an evening cohort
    { id: 'l1',  name: 'Dr. Tamo Jean',      type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: 'Génie Logiciel (GL)' },
    { id: 'l4',  name: 'Dr. Kamga Paul',     type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: 'Génie Logiciel (GL)' },
    { id: 'l9',  name: 'Dr. Mbarga Alice',   type: 'permanent', day: true,  eve: false, maxHours: 18, speciality: 'Génie Logiciel (GL)' },
    { id: 'l10', name: 'M. Essomba Eric',    type: 'vacataire', day: false, eve: true,  maxHours: 16, speciality: 'Génie Logiciel (GL)' },
    // Réseaux & Télécoms (RT) — 3 groups (incl. evening): keep 4 teachers so no
    // one is pushed over their contract (3 groups ≈ 60 h/week of demand).
    { id: 'l2',  name: 'Prof. Ndi Marie',    type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: 'Réseaux & Télécoms (RT)' },
    { id: 'l8',  name: 'Prof. Ewane Clara',  type: 'visiting',  day: true,  eve: true,  maxHours: 20, speciality: 'Réseaux & Télécoms (RT)' },
    { id: 'l11', name: 'M. Atangana Paul',   type: 'vacataire', day: false, eve: true,  maxHours: 16, speciality: 'Réseaux & Télécoms (RT)' },
    { id: 'l15', name: 'Dr. Sona Brigitte',  type: 'permanent', day: true,  eve: true,  maxHours: 18, speciality: 'Réseaux & Télécoms (RT)' },
    // Comptabilité & Finance (CF)
    { id: 'l3',  name: 'M. Oumarou Hamidou', type: 'vacataire', day: true,  eve: true,  maxHours: 18, speciality: 'Comptabilité & Finance (CF)' },
    { id: 'l7',  name: 'M. Ngassa Robert',   type: 'permanent', day: true,  eve: true,  maxHours: 18, speciality: 'Comptabilité & Finance (CF)' },
    { id: 'l12', name: 'Mme. Abena Rose',    type: 'vacataire', day: false, eve: true,  maxHours: 16, speciality: 'Comptabilité & Finance (CF)' },
    // Design Graphique (GD) & Sécurité (SSI)
    { id: 'l5',  name: 'Mme. Foko Edith',    type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: 'Design Graphique (GD)' },
    { id: 'l6',  name: 'Dr. Biya François',  type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: 'Sécurité des Systèmes (SSI)' },
    // Flexible lecturers (general modules: maths, languages — any speciality).
    // 3 of them so cross-cutting modules across all levels stay within contract.
    { id: 'l13', name: 'Dr. Nkeng Sarah',    type: 'permanent', day: true,  eve: true,  maxHours: 20, speciality: null },
    { id: 'l14', name: 'M. Fotso Bernard',   type: 'vacataire', day: true,  eve: true,  maxHours: 16, speciality: null },
    { id: 'l16', name: 'Mme. Tabi Grace',    type: 'vacataire', day: true,  eve: true,  maxHours: 16, speciality: null },
  ]);

  await db.rooms.bulkAdd([
    { id: 'r1', name: 'Amphi 500',    cap: 500, eve: true,  type: 'amphitheater' },
    { id: 'r2', name: 'Amphi 200',    cap: 200, eve: true,  type: 'amphitheater' },
    { id: 'r3', name: 'Salle A-101',  cap: 60,  eve: true,  type: 'classroom' },
    { id: 'r4', name: 'Salle A-102',  cap: 50,  eve: true,  type: 'classroom' },
    { id: 'r5', name: 'Salle B-201',  cap: 45,  eve: true,  type: 'classroom' },
    { id: 'r6', name: 'Labo Info 1',  cap: 30,  eve: false, type: 'lab' },
    { id: 'r7', name: 'Labo Info 2',  cap: 30,  eve: false, type: 'lab' },
    { id: 'r8', name: 'Salle Réseau', cap: 25,  eve: false, type: 'lab' },
  ]);

  await db.courses.bulkAdd([
    // Génie Logiciel (GL)
    { id: 'c_gl1', code: 'INF301', name_en: 'Algorithms & Data Structures', name_fr: 'Algorithmique & Structures de Données', credits: 4, hoursPerWeek: 4, shareable: false, speciality: 'Génie Logiciel (GL)' },
    { id: 'c_gl2', code: 'WEB302', name_en: 'Web Development',               name_fr: 'Développement Web',                    credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Génie Logiciel (GL)' },
    { id: 'c_gl3', code: 'DB303',  name_en: 'Database Systems',               name_fr: 'Bases de Données',                    credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Génie Logiciel (GL)' },
    { id: 'c_gl4', code: 'SYS304', name_en: 'Operating Systems',              name_fr: 'Systèmes d\'Exploitation',            credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Génie Logiciel (GL)' },
    { id: 'c_gl5', code: 'MOB305', name_en: 'Mobile Development',             name_fr: 'Développement Mobile',                credits: 3, hoursPerWeek: 2, shareable: false, speciality: 'Génie Logiciel (GL)' },
    // Réseaux & Télécoms (RT)
    { id: 'c_rt1', code: 'NET201', name_en: 'Computer Networks',              name_fr: 'Réseaux Informatiques',               credits: 4, hoursPerWeek: 4, shareable: false, speciality: 'Réseaux & Télécoms (RT)' },
    { id: 'c_rt2', code: 'SEC202', name_en: 'Network Security',               name_fr: 'Sécurité Réseau',                     credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Réseaux & Télécoms (RT)' },
    { id: 'c_rt3', code: 'TEL203', name_en: 'Telecommunications',             name_fr: 'Télécommunications',                  credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Réseaux & Télécoms (RT)' },
    // Comptabilité & Finance (CF)
    { id: 'c_cf1', code: 'ACC201', name_en: 'Financial Accounting',           name_fr: 'Comptabilité Financière',             credits: 4, hoursPerWeek: 4, shareable: false, speciality: 'Comptabilité & Finance (CF)' },
    { id: 'c_cf2', code: 'AUD202', name_en: 'Auditing',                       name_fr: 'Audit Financier',                     credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Comptabilité & Finance (CF)' },
    { id: 'c_cf3', code: 'FIS203', name_en: 'Taxation',                       name_fr: 'Fiscalité',                           credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Comptabilité & Finance (CF)' },
    // Design Graphique (GD)
    { id: 'c_gd1', code: 'DES101', name_en: 'Design Fundamentals',            name_fr: 'Fondamentaux du Design',              credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Design Graphique (GD)' },
    { id: 'c_gd2', code: 'PHO102', name_en: 'Photography & Image Processing', name_fr: 'Photographie & Traitement d\'image',  credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Design Graphique (GD)' },
    // Sécurité des Systèmes (SSI)
    { id: 'c_cs1', code: 'CYB101', name_en: 'Ethical Hacking',                name_fr: 'Hacking Éthique',                    credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Sécurité des Systèmes (SSI)' },
    { id: 'c_cs2', code: 'CRY102', name_en: 'Cryptography',                   name_fr: 'Cryptographie',                      credits: 3, hoursPerWeek: 3, shareable: false, speciality: 'Sécurité des Systèmes (SSI)' },
    // Shared / General modules
    { id: 'c_sh1', code: 'MAT101', name_en: 'Mathematics',                    name_fr: 'Mathématiques',                      credits: 4, hoursPerWeek: 4, shareable: true,  speciality: null },
    { id: 'c_sh2', code: 'ENG101', name_en: 'English Communication',          name_fr: 'Anglais Communication',              credits: 2, hoursPerWeek: 2, shareable: true,  speciality: null },
    { id: 'c_sh3', code: 'FRE101', name_en: 'French Communication',           name_fr: 'Français Communication',             credits: 2, hoursPerWeek: 2, shareable: true,  speciality: null },
  ]);

  // Seed fixed Cameroon holidays for current year
  const year = new Date().getFullYear();
  const fixedHolidays = CAMEROON_HOLIDAYS.filter(h => !h.variable).map(h => ({
    id: h.id,
    date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name_fr: h.name_fr,
    name_en: h.name_en,
    type: h.type,
    full_day: true,
  }));
  await db.holidays.bulkAdd(fixedHolidays);
}

// 4. Local data action wrapper
export async function performOfflineAction(actionType, entityType, data) {
  if (actionType === 'ADD' || actionType === 'UPDATE') {
    await db[entityType].put(data);
  } else if (actionType === 'DELETE') {
    await db[entityType].delete(data.id);
  }
}

// 5. Settings helpers
export async function getSetting(key) {
  const row = await db.settings.get(key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
