import { specialityMatches } from './cameroonSpecialities';

/** Normalize legacy en/fr fields to name_en/name_fr */
export function normalizeCourse(course) {
  if (!course) return course;
  return {
    ...course,
    name_en: course.name_en || course.en || '',
    name_fr: course.name_fr || course.fr || '',
  };
}

export function getCourseName(course, lang = 'fr') {
  const c = normalizeCourse(course);
  return lang === 'fr'
    ? (c.name_fr || c.name_en || c.code || '?')
    : (c.name_en || c.name_fr || c.code || '?');
}

/** Courses assignable to a given student group */
export function coursesForGroup(group, courses) {
  return courses.map(normalizeCourse).filter(c => {
    if (c.shareable) return true;
    if (!group.speciality) return !c.speciality;
    return specialityMatches(c.speciality, group.speciality);
  });
}

/** Lecturers who can teach a course for a group */
export function lecturersForCourse(course, group, lecturers) {
  const spec = course.speciality || group.speciality;
  return lecturers.filter(l => !l.speciality || !spec || specialityMatches(l.speciality, spec));
}

/**
 * Hours delivered in ONE session of this course. A normal session is a 2h slot;
 * a block course delivers its whole weekly load in one sitting (e.g. a 4h lab).
 */
export function sessionHoursForCourse(course) {
  const SLOT_HOURS = 2;
  if (course?.block) return Math.max(SLOT_HOURS, Number(course.hoursPerWeek) || SLOT_HOURS);
  return SLOT_HOURS;
}

/**
 * Convert a course's total semester HOURS volume into a whole number of
 * sessions (the unit the generator counts down — `Séance n/total`). Empty/zero
 * hours → '' meaning "no fixed total, run the whole semester".
 */
export function hoursToSessions(totalHours, course) {
  const h = Number(totalHours);
  if (!h || h <= 0) return '';
  return Math.max(1, Math.round(h / sessionHoursForCourse(course)));
}

/** Prepare course record for DB storage */
export function prepareCourseForSave(form, editItem) {
  // Admins think in total HOURS; the generator counts SESSIONS. Derive sessions
  // from the entered hours so a course stops generating once its hours run out.
  const totalHours = form.totalHours ? Number(form.totalHours) : null;
  const totalSessions = totalHours ? hoursToSessions(totalHours, form) : null;
  const data = {
    ...(editItem || {}),
    id: editItem?.id || `c_${Date.now()}`,
    code: form.code.trim(),
    name_en: form.name_en.trim(),
    name_fr: form.name_fr.trim(),
    credits: form.credits,
    hoursPerWeek: form.hoursPerWeek,
    totalHours,            // what the admin entered (for display / round-trip)
    totalSessions,         // derived; what the scheduler reads to cap the course
    block: !!form.block,   // delivered as one contiguous block (e.g. 4h lab) vs split 2h periods
    roomType: form.roomType || null,   // required room type (e.g. 'lab'); null = any
    shareable: form.shareable,
    speciality: form.shareable ? null : (form.speciality || null),
  };
  return data;
}

/** Read course into form fields */
export function courseToForm(c) {
  const n = normalizeCourse(c);
  // Prefer a stored hours volume; else back-derive from a legacy session count
  // so existing courses still show their hours in the form.
  const totalHours = n.totalHours ?? (n.totalSessions ? n.totalSessions * sessionHoursForCourse(n) : '');
  return {
    code: n.code || '',
    name_en: n.name_en || '',
    name_fr: n.name_fr || '',
    credits: n.credits ?? 3,
    hoursPerWeek: n.hoursPerWeek ?? 3,
    totalHours,
    block: !!n.block,
    roomType: n.roomType || '',
    shareable: !!n.shareable,
    speciality: n.speciality || '',
  };
}
