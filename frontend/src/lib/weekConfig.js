export const WEEK_DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEK_DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const WEEK_DAYS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEK_DAYS_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function parseBool(v, defaultVal) {
  if (v === undefined || v === null) return defaultVal;
  return v === true || v === 'true';
}

/** Colleges: Mon–Sat (6). Universities: Mon–Sun (7) by default. */
export function getWeekDayCount(institutionType = 'university', settings = {}) {
  if (institutionType === 'secondary') {
    return parseBool(settings.showSaturday, true) ? 6 : 5;
  }
  let days = 5;
  if (parseBool(settings.showSaturday, true)) days = 6;
  if (parseBool(settings.showSunday, true)) days = 7;
  return days;
}

export function getWeekDayLabels(numDays, lang = 'fr', short = false) {
  const full = lang === 'fr' ? WEEK_DAYS_FR : WEEK_DAYS_EN;
  const abbr = lang === 'fr' ? WEEK_DAYS_SHORT_FR : WEEK_DAYS_SHORT_EN;
  const pack = short ? abbr : full;
  return pack.slice(0, numDays);
}

export function formatWeekRange(monday, numDays, lang = 'fr') {
  const end = new Date(monday);
  end.setDate(end.getDate() + numDays - 1);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const startStr = monday.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  const endStr = end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return lang === 'fr'
    ? `Semaine du ${startStr} au ${endStr}`
    : `Week of ${startStr} – ${endStr}`;
}
