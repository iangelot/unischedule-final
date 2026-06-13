import { create } from 'zustand';
import { ROLES } from '../lib/auth';

function readUser() {
  try { return JSON.parse(sessionStorage.getItem('user') || 'null'); }
  catch { return null; }
}

const savedLang = localStorage.getItem('uiLanguage') || 'fr';

export const useAppStore = create((set, get) => ({
  isAuthenticated: !!sessionStorage.getItem('token'),
  user: readUser(),
  language: savedLang,

  login: ({ token, user }) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('lastActivity', String(Date.now()));
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('lastActivity');
    set({ isAuthenticated: false, user: null });
  },

  touchSession: () => {
    if (get().isAuthenticated) {
      sessionStorage.setItem('lastActivity', String(Date.now()));
    }
  },

  isAdmin: () => get().user?.role === ROLES.ADMIN,
  isTimetabler: () => get().user?.role === ROLES.TIMETABLER,

  setLanguage: (lang) => {
    localStorage.setItem('uiLanguage', lang);
    set({ language: lang });
    // Keep PDF export language in sync
    import('../db').then(({ setSetting }) => setSetting('language', lang).catch(() => {}));
  },
}));
