#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
  }
  const client = await pool.connect();
  console.log('🌱 Seeding ISIMA Yaoundé demo data...\n');
  try {
    await client.query('BEGIN');

    // Institution
    const instId = uuidv4();
    await client.query(`
      INSERT INTO institutions (id,name,short_name,country,city,language_mode,academic_system,saturday_enabled)
      VALUES ($1,$2,'ISIMA','CM','Yaoundé','fr','lmd',true)
    `, [instId, "Institut Supérieur d'Informatique et de Management Appliqué"]);

    // Admin + Timetabler users
    const adminId = uuidv4();
    await client.query(`
      INSERT INTO institution_users (id,institution_id,email,phone,full_name,role,language_pref,password_hash)
      VALUES ($1,$2,'admin@isima.cm','+237699000001','Directeur Admin','admin','fr',$3)
    `, [adminId, instId, await bcrypt.hash('admin123', 12)]);

    const ttId = uuidv4();
    await client.query(`
      INSERT INTO institution_users (id,institution_id,email,phone,full_name,role,language_pref,password_hash)
      VALUES ($1,$2,'timetabler@isima.cm','+237677000002','Responsable EDT','timetabler','fr',$3)
    `, [ttId, instId, await bcrypt.hash('schedule123', 12)]);

    // Faculty + Department
    const facId = uuidv4();
    await client.query(`INSERT INTO faculties (id,institution_id,name,name_fr,name_en) VALUES ($1,$2,'Faculté Sciences & Technologies','Faculté Sciences & Technologies','Faculty of Science & Technology')`, [facId, instId]);
    const deptId = uuidv4();
    await client.query(`INSERT INTO departments (id,faculty_id,institution_id,name) VALUES ($1,$2,$3,'Département Informatique')`, [deptId, facId, instId]);

    // Programmes
    const progs = [
      { id: uuidv4(), name: 'Licence Informatique — Génie Logiciel',      short: 'SWE',      mode: 'day' },
      { id: uuidv4(), name: 'Licence Informatique — Réseaux & Télécoms',   short: 'RESEAU',   mode: 'day' },
      { id: uuidv4(), name: 'Licence Infographie & Multimédia',            short: 'GRAPHISME',mode: 'day' },
      { id: uuidv4(), name: 'Licence Informatique Soirée',                  short: 'INFO-S',   mode: 'evening' },
    ];
    for (const p of progs) {
      await client.query(`INSERT INTO programmes (id,department_id,institution_id,name,short_name,mode) VALUES ($1,$2,$3,$4,$5,$6)`, [p.id, deptId, instId, p.name, p.short, p.mode]);
    }

    // Student Groups
    const groups = [
      { id: uuidv4(), prog: progs[0].id, name: 'SWE-L3-J',       level: 3, mode: 'day',     enroll: 35 },
      { id: uuidv4(), prog: progs[1].id, name: 'RESEAU-L3-J',     level: 3, mode: 'day',     enroll: 40 },
      { id: uuidv4(), prog: progs[2].id, name: 'GRAPHISME-L3-J',  level: 3, mode: 'day',     enroll: 28 },
      { id: uuidv4(), prog: progs[3].id, name: 'SWE-L3-S',        level: 3, mode: 'evening', enroll: 22 },
      { id: uuidv4(), prog: progs[3].id, name: 'RESEAU-L3-S',     level: 3, mode: 'evening', enroll: 19 },
      { id: uuidv4(), prog: progs[0].id, name: 'SWE-L2-J',        level: 2, mode: 'day',     enroll: 45 },
    ];
    for (const g of groups) {
      await client.query(`INSERT INTO student_groups (id,programme_id,institution_id,name,level,mode,max_students,current_enrollment,academic_year,semester) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'2025-2026',1)`, [g.id, g.prog, instId, g.name, g.level, g.mode, g.enroll + 10, g.enroll]);
    }

    // Building + Rooms
    const bldgId = uuidv4();
    await client.query(`INSERT INTO buildings (id,institution_id,name,has_evening_lighting,has_generator) VALUES ($1,$2,'Bâtiment Principal',true,true)`, [bldgId, instId]);
    const rooms = [
      { id: uuidv4(), name: 'Amphi A',    type: 'amphitheater', cap: 200 },
      { id: uuidv4(), name: 'Amphi B',    type: 'amphitheater', cap: 120 },
      { id: uuidv4(), name: 'Salle 101',  type: 'classroom',    cap: 50  },
      { id: uuidv4(), name: 'Salle 102',  type: 'classroom',    cap: 50  },
      { id: uuidv4(), name: 'Labo Réseau',type: 'lab',          cap: 30  },
      { id: uuidv4(), name: 'Labo Info 1',type: 'lab',          cap: 35  },
    ];
    for (const r of rooms) {
      await client.query(`INSERT INTO rooms (id,institution_id,building_id,name,capacity,room_type,is_shared_resource) VALUES ($1,$2,$3,$4,$5,$6,true)`, [r.id, instId, bldgId, r.name, r.cap, r.type]);
    }

    // Lecturers
    const lecs = [
      { id: uuidv4(), name: 'Dr. Emmanuel Mbarga', type: 'permanent', day: true,  eve: true,  maxH: 18, phone: '+237677001234' },
      { id: uuidv4(), name: 'Mme. Fatou Diallo',   type: 'permanent', day: true,  eve: false, maxH: 20, phone: '+237699456789' },
      { id: uuidv4(), name: 'M. Patrick Essomba',  type: 'vacataire', day: false, eve: true,  maxH: 10, phone: '+237655321654' },
      { id: uuidv4(), name: 'Dr. Aissatou Bah',    type: 'visiting',  day: true,  eve: true,  maxH: 12, phone: '+237677888333' },
    ];
    for (const l of lecs) {
      await client.query(`INSERT INTO lecturers (id,institution_id,full_name,phone,lecturer_type,max_hours_per_week,teaches_day,teaches_evening) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [l.id, instId, l.name, l.phone, l.type, l.maxH, l.day, l.eve]);
    }

    // Courses
    const courses = [
      { id: uuidv4(), code: 'INF301', fr: 'Gestion de Projet',       en: 'Project Management', shareable: true  },
      { id: uuidv4(), code: 'INF302', fr: 'Structures de Données',    en: 'Data Structures',    shareable: false },
      { id: uuidv4(), code: 'RES301', fr: 'Administration Réseaux',   en: 'Network Admin',      shareable: false },
      { id: uuidv4(), code: 'INF303', fr: 'Bases de Données',         en: 'Databases',          shareable: false },
      { id: uuidv4(), code: 'GFX301', fr: 'Design Graphique',         en: 'Graphic Design',     shareable: false },
      { id: uuidv4(), code: 'MGT201', fr: 'Management',               en: 'Management',         shareable: true  },
      { id: uuidv4(), code: 'INF304', fr: 'Programmation Web',        en: 'Web Programming',    shareable: false },
    ];
    for (const c of courses) {
      await client.query(`INSERT INTO courses (id,institution_id,code,name,name_fr,name_en,is_shareable,department_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [c.id, instId, c.code, c.fr, c.fr, c.en, c.shareable, deptId]);
    }

    // Active timetable
    const timetableId = uuidv4();
    await client.query(`INSERT INTO timetables (id,institution_id,name,academic_year,semester,status,is_active) VALUES ($1,$2,'Semestre 1 — 2025-2026','2025-2026',1,'draft',true)`, [timetableId, instId]);

    await client.query('COMMIT');
    console.log('✅ Institution, users, academic structure, rooms, lecturers, courses, timetable');
    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────────────');
    console.log('  Admin:      admin@isima.cm       / admin123');
    console.log('  Timetabler: timetabler@isima.cm  / schedule123');
    console.log('─────────────────────────────────────────────');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
seed();
