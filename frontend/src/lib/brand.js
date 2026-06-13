/** UniSchedule brand assets (shared across UI + PDF) */

export const APP_NAME = 'UniSchedule';
export const APP_TAGLINE = 'Smart Timetables. Effortless.';
export const APP_LOGO_URL = '/unischedule-logo.png';

let _logoDataUrl = null;

/** Load logo as data-URL for jsPDF (cached). */
export async function getAppLogoDataUrl() {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const res = await fetch(APP_LOGO_URL);
    const blob = await res.blob();
    _logoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return _logoDataUrl;
  } catch {
    return null;
  }
}
