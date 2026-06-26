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

/** Prepare course record for DB storage */
export function prepareCourseForSave(form, editItem) {
  const data = {
    ...(editItem || {}),
    id: editItem?.id || `c_${Date.now()}`,
    code: form.code.trim(),
    name_en: form.name_en.trim(),
    name_fr: form.name_fr.trim(),
    credits: form.credits,
    hoursPerWeek: form.hoursPerWeek,
    totalSessions: form.totalSessions ? Number(form.totalSessions) : null,
    block: !!form.block,   // delivered as one contiguous block (e.g. 4h lab) vs split 2h periods
    shareable: form.shareable,
    speciality: form.shareable ? null : (form.speciality || null),
  };
  return data;
}

/** Read course into form fields */
export function courseToForm(c) {
  const n = normalizeCourse(c);
  return {
    code: n.code || '',
    name_en: n.name_en || '',
    name_fr: n.name_fr || '',
    credits: n.credits ?? 3,
    hoursPerWeek: n.hoursPerWeek ?? 3,
    totalSessions: n.totalSessions ?? '',
    block: !!n.block,
    shareable: !!n.shareable,
    speciality: n.speciality || '',
  };
}
