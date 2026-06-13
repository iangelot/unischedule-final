-- Migration: Create initial database schema
-- Created: 2026-06-05

-- UP

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── INSTITUTIONS ──────────────────────────────────────────
CREATE TABLE institutions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(255) NOT NULL,
  short_name              VARCHAR(50)  NOT NULL,
  country                 CHAR(2)      NOT NULL DEFAULT 'CM',
  city                    VARCHAR(100) NOT NULL DEFAULT 'Yaoundé',
  language_mode           VARCHAR(10)  NOT NULL DEFAULT 'fr',
  academic_system         VARCHAR(20)  NOT NULL DEFAULT 'lmd',
  day_start_time          TIME         NOT NULL DEFAULT '07:00',
  day_end_time            TIME         NOT NULL DEFAULT '17:00',
  evening_start_time      TIME         NOT NULL DEFAULT '18:00',
  evening_end_time        TIME         NOT NULL DEFAULT '22:00',
  campus_closes_at        TIME         NOT NULL DEFAULT '22:00',
  saturday_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
  friday_prayer_protected BOOLEAN      NOT NULL DEFAULT FALSE,
  subscription_plan       VARCHAR(20)  NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE institution_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(30)  NOT NULL DEFAULT 'viewer',
  language_pref   VARCHAR(5)   NOT NULL DEFAULT 'fr',
  password_hash   VARCHAR(255) NOT NULL,
  last_login_at   TIMESTAMPTZ,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT valid_role CHECK (role IN ('superadmin','admin','timetabler','viewer','lecturer'))
);

-- ── ACADEMIC STRUCTURE ────────────────────────────────────
CREATE TABLE faculties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  name_fr         VARCHAR(255),
  name_en         VARCHAR(255),
  dean_user_id    UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id      UUID         NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  hod_user_id     UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE programmes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id    UUID         NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  institution_id   UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  short_name       VARCHAR(50)  NOT NULL,
  academic_system  VARCHAR(20)  NOT NULL DEFAULT 'lmd',
  mode             VARCHAR(10)  NOT NULL DEFAULT 'day',
  duration_years   SMALLINT     NOT NULL DEFAULT 3,
  total_levels     SMALLINT     NOT NULL DEFAULT 3,
  language         VARCHAR(5)   NOT NULL DEFAULT 'fr',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  CONSTRAINT valid_mode CHECK (mode IN ('day','evening','weekend'))
);

CREATE TABLE student_groups (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_id       UUID         NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  institution_id     UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name               VARCHAR(100) NOT NULL,
  level              SMALLINT     NOT NULL,
  mode               VARCHAR(10)  NOT NULL DEFAULT 'day',
  max_students       SMALLINT     NOT NULL DEFAULT 50,
  current_enrollment SMALLINT     NOT NULL DEFAULT 0,
  academic_year      VARCHAR(9)   NOT NULL,
  semester           SMALLINT     NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

-- ── COURSES ──────────────────────────────────────────────
CREATE TABLE courses (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id           UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  code                     VARCHAR(20)  NOT NULL,
  name                     VARCHAR(255) NOT NULL,
  name_fr                  VARCHAR(255),
  name_en                  VARCHAR(255),
  credits                  SMALLINT     NOT NULL DEFAULT 3,
  hours_per_week           SMALLINT     NOT NULL DEFAULT 4,
  session_duration_minutes SMALLINT     NOT NULL DEFAULT 120,
  sessions_per_week        SMALLINT     NOT NULL DEFAULT 2,
  course_type              VARCHAR(20)  NOT NULL DEFAULT 'lecture',
  requires_lab             BOOLEAN      NOT NULL DEFAULT FALSE,
  is_shareable             BOOLEAN      NOT NULL DEFAULT FALSE,
  department_id            UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ,
  UNIQUE(institution_id, code)
);

-- ── BUILDINGS + ROOMS ────────────────────────────────────
CREATE TABLE buildings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id       UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name                 VARCHAR(100) NOT NULL,
  has_evening_lighting BOOLEAN      NOT NULL DEFAULT TRUE,
  has_generator        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE TABLE rooms (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id     UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  building_id        UUID REFERENCES buildings(id) ON DELETE SET NULL,
  name               VARCHAR(100) NOT NULL,
  capacity           SMALLINT     NOT NULL,
  room_type          VARCHAR(20)  NOT NULL DEFAULT 'classroom',
  is_shared_resource BOOLEAN      NOT NULL DEFAULT FALSE,
  owning_faculty_id  UUID REFERENCES faculties(id) ON DELETE SET NULL,
  has_projector      BOOLEAN      NOT NULL DEFAULT FALSE,
  has_ac             BOOLEAN      NOT NULL DEFAULT FALSE,
  available_from     TIME         NOT NULL DEFAULT '07:00',
  available_until    TIME         NOT NULL DEFAULT '22:00',
  notes              TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT valid_room_type CHECK (room_type IN ('amphitheater','classroom','lab','seminar'))
);

CREATE TABLE room_blackouts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  reason     VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LECTURERS ────────────────────────────────────────────
CREATE TABLE lecturers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id      UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255),
  phone               VARCHAR(20),
  lecturer_type       VARCHAR(20)  NOT NULL DEFAULT 'permanent',
  max_hours_per_week  SMALLINT     NOT NULL DEFAULT 20,
  max_hours_per_day   SMALLINT     NOT NULL DEFAULT 6,
  teaches_day         BOOLEAN      NOT NULL DEFAULT TRUE,
  teaches_evening     BOOLEAN      NOT NULL DEFAULT FALSE,
  teaches_saturday    BOOLEAN      NOT NULL DEFAULT FALSE,
  multi_institution   BOOLEAN      NOT NULL DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT valid_lecturer_type CHECK (lecturer_type IN ('permanent','vacataire','visiting','part_time'))
);

CREATE TABLE lecturer_availability (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_id    UUID     NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  institution_id UUID     NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  day_of_week    SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  start_time     TIME     NOT NULL,
  end_time       TIME     NOT NULL,
  is_available   BOOLEAN  NOT NULL DEFAULT TRUE,
  valid_from     DATE,
  valid_until    DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lecturer_blackouts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  reason      VARCHAR(255),
  notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TIMETABLES ──────────────────────────────────────────
CREATE TABLE timetables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  academic_year   VARCHAR(9)   NOT NULL,
  semester        SMALLINT     NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  published_by    UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  generation_log  JSONB,
  is_active       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('draft','generating','published','archived'))
);

-- ── SESSIONS ────────────────────────────────────────────
CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  timetable_id   UUID         NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  course_id      UUID         NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  lecturer_id    UUID         NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
  room_id        UUID         NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  day_of_week    SMALLINT     NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  slot_index     SMALLINT     NOT NULL,
  mode           VARCHAR(10)  NOT NULL DEFAULT 'day',
  session_type   VARCHAR(20)  NOT NULL DEFAULT 'regular',
  is_combined    BOOLEAN      NOT NULL DEFAULT FALSE,
  total_students SMALLINT     NOT NULL DEFAULT 0,
  status         VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
  cancel_reason  TEXT,
  substitute_id  UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  is_locked      BOOLEAN      NOT NULL DEFAULT FALSE,
  locked_by      UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  is_makeup      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_generated   BOOLEAN      NOT NULL DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT valid_mode   CHECK (mode   IN ('day','evening')),
  CONSTRAINT valid_status CHECK (status IN ('scheduled','cancelled','rescheduled','completed'))
);

CREATE TABLE session_groups (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID     NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_group_id UUID     NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  enrollment_count SMALLINT NOT NULL DEFAULT 0,
  UNIQUE(session_id, student_group_id)
);

-- ── EXAMS ───────────────────────────────────────────────
CREATE TABLE exams (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id   UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  timetable_id     UUID REFERENCES timetables(id) ON DELETE SET NULL,
  course_id        UUID         NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  room_id          UUID         NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  invigilator_id   UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  exam_date        DATE         NOT NULL,
  start_time       TIME         NOT NULL,
  duration_minutes SMALLINT     NOT NULL DEFAULT 120,
  exam_type        VARCHAR(20)  NOT NULL DEFAULT 'written',
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  CONSTRAINT valid_exam_type CHECK (exam_type IN ('written','oral','practical'))
);

CREATE TABLE exam_groups (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id  UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  UNIQUE(exam_id, group_id)
);

-- ── CONFLICTS ──────────────────────────────────────────
CREATE TABLE conflicts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id    UUID         NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  conflict_type   VARCHAR(50)  NOT NULL,
  severity        VARCHAR(10)  NOT NULL DEFAULT 'hard',
  session_a_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  session_b_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  description     TEXT         NOT NULL,
  is_resolved     BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_by     UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ──────────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id  UUID         NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  recipient_type  VARCHAR(20)  NOT NULL,
  recipient_id    UUID         NOT NULL,
  channel         VARCHAR(10)  NOT NULL DEFAULT 'sms',
  message_fr      TEXT         NOT NULL,
  message_en      TEXT,
  trigger_event   VARCHAR(50)  NOT NULL,
  session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
  status          VARCHAR(15)  NOT NULL DEFAULT 'pending',
  sent_at         TIMESTAMPTZ,
  provider_ref    VARCHAR(100),
  error_message   TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_channel CHECK (channel IN ('sms','whatsapp','email','in_app')),
  CONSTRAINT valid_notif_status CHECK (status IN ('pending','sent','failed','delivered'))
);

-- ── AUDIT LOG ──────────────────────────────────────────
CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID        NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES institution_users(id) ON DELETE SET NULL,
  action         VARCHAR(50) NOT NULL,
  entity_type    VARCHAR(50) NOT NULL,
  entity_id      UUID        NOT NULL,
  before_state   JSONB,
  after_state    JSONB,
  ip_address     INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ────────────────────────────────────────────
CREATE INDEX idx_sessions_slot        ON sessions(institution_id,timetable_id,day_of_week,slot_index) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_lecturer    ON sessions(institution_id,lecturer_id,day_of_week,slot_index)  WHERE deleted_at IS NULL AND status != 'cancelled';
CREATE INDEX idx_sessions_room        ON sessions(institution_id,room_id,day_of_week,slot_index)      WHERE deleted_at IS NULL AND status != 'cancelled';
CREATE INDEX idx_session_groups_group ON session_groups(student_group_id,session_id);
CREATE INDEX idx_timetables_active    ON timetables(institution_id,is_active,status);
CREATE INDEX idx_conflicts_timetable  ON conflicts(timetable_id,severity,is_resolved);
CREATE INDEX idx_notif_pending        ON notifications(institution_id,status,channel) WHERE status='pending';
CREATE INDEX idx_lec_avail            ON lecturer_availability(lecturer_id,day_of_week,is_available);
CREATE INDEX idx_exams_date           ON exams(institution_id,exam_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_entity         ON audit_log(institution_id,entity_type,entity_id);

-- DOWN

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS conflicts;
DROP TABLE IF EXISTS exam_groups;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS session_groups;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS timetables;
DROP TABLE IF EXISTS lecturer_blackouts;
DROP TABLE IF EXISTS lecturer_availability;
DROP TABLE IF EXISTS lecturers;
DROP TABLE IF EXISTS room_blackouts;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS student_groups;
DROP TABLE IF EXISTS programmes;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS institution_users;
DROP TABLE IF EXISTS institutions;
DROP EXTENSION IF EXISTS "uuid-ossp";
