/** High-contrast session cards — white background, dark text, coloured left accent only. */

const LEFT_ACCENTS = [
  'border-l-blue-600',
  'border-l-violet-600',
  'border-l-emerald-600',
  'border-l-amber-600',
  'border-l-rose-600',
  'border-l-cyan-600',
  'border-l-orange-600',
  'border-l-indigo-600',
];

export function buildCourseAccentMap(courses) {
  const m = {};
  courses.forEach((c, i) => { m[c.id] = i % LEFT_ACCENTS.length; });
  return m;
}

export function sessionCardClasses(accentIndex = 0) {
  const accent = LEFT_ACCENTS[accentIndex % LEFT_ACCENTS.length];
  return `bg-white border border-slate-300 ${accent} border-l-4 text-slate-900 rounded-lg px-2.5 py-2 mb-1.5 leading-snug shadow-sm`;
}
