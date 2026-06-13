-- UP: Enable Row Level Security on sensitive tables
ALTER TABLE institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Function to get current user's institution_id from JWT token
-- In production, this would be stored in PostgreSQL session via JWT header
CREATE OR REPLACE FUNCTION get_current_institution_id() RETURNS uuid AS $$
BEGIN
  -- This is a placeholder - in production, use PostgreSQL extension like pgjwt
  -- or set via app: SELECT set_config('app.institution_id', '...', false);
  RETURN (current_setting('app.institution_id', true))::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policies for institution_users
CREATE POLICY institution_users_select ON institution_users
  FOR SELECT USING (
    institution_id = get_current_institution_id()
  );

CREATE POLICY institution_users_insert ON institution_users
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY institution_users_update ON institution_users
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for courses
CREATE POLICY courses_select ON courses
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY courses_insert ON courses
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY courses_update ON courses
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for sessions
CREATE POLICY sessions_select ON sessions
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY sessions_insert ON sessions
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY sessions_update ON sessions
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for timetables
CREATE POLICY timetables_select ON timetables
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY timetables_insert ON timetables
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY timetables_update ON timetables
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for student_groups
CREATE POLICY student_groups_select ON student_groups
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY student_groups_insert ON student_groups
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY student_groups_update ON student_groups
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for lecturers
CREATE POLICY lecturers_select ON lecturers
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY lecturers_insert ON lecturers
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY lecturers_update ON lecturers
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for rooms
CREATE POLICY rooms_select ON rooms
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY rooms_insert ON rooms
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY rooms_update ON rooms
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for exams
CREATE POLICY exams_select ON exams
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY exams_insert ON exams
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

CREATE POLICY exams_update ON exams
  FOR UPDATE USING (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for notifications
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

-- RLS Policies for audit_log
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (
    institution_id = get_current_institution_id()
    AND deleted_at IS NULL
  );

CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (
    institution_id = get_current_institution_id()
  );

-- DOWN: Disable Row Level Security
ALTER TABLE institution_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE timetables DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS get_current_institution_id();

DROP POLICY IF EXISTS institution_users_select ON institution_users;
DROP POLICY IF EXISTS institution_users_insert ON institution_users;
DROP POLICY IF EXISTS institution_users_update ON institution_users;

DROP POLICY IF EXISTS courses_select ON courses;
DROP POLICY IF EXISTS courses_insert ON courses;
DROP POLICY IF EXISTS courses_update ON courses;

DROP POLICY IF EXISTS sessions_select ON sessions;
DROP POLICY IF EXISTS sessions_insert ON sessions;
DROP POLICY IF EXISTS sessions_update ON sessions;

DROP POLICY IF EXISTS timetables_select ON timetables;
DROP POLICY IF EXISTS timetables_insert ON timetables;
DROP POLICY IF EXISTS timetables_update ON timetables;

DROP POLICY IF EXISTS student_groups_select ON student_groups;
DROP POLICY IF EXISTS student_groups_insert ON student_groups;
DROP POLICY IF EXISTS student_groups_update ON student_groups;

DROP POLICY IF EXISTS lecturers_select ON lecturers;
DROP POLICY IF EXISTS lecturers_insert ON lecturers;
DROP POLICY IF EXISTS lecturers_update ON lecturers;

DROP POLICY IF EXISTS rooms_select ON rooms;
DROP POLICY IF EXISTS rooms_insert ON rooms;
DROP POLICY IF EXISTS rooms_update ON rooms;

DROP POLICY IF EXISTS exams_select ON exams;
DROP POLICY IF EXISTS exams_insert ON exams;
DROP POLICY IF EXISTS exams_update ON exams;

DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;

DROP POLICY IF EXISTS audit_log_select ON audit_log;
DROP POLICY IF EXISTS audit_log_insert ON audit_log;
