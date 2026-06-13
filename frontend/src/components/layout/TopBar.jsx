import React from 'react';
import { Bell, Search, HardDrive, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useLang } from '../../hooks/useLang';
import LanguageToggle from '../LanguageToggle';
import { badgeInfo, badgeNeutral } from '../../lib/uiBadges';

const PAGE_TITLE_KEYS = {
  dashboard: 'navDashboard',
  timetable: 'navTimetable',
  'timetable-history': 'navHistory',
  groups: 'navGroups',
  lecturers: 'navLecturers',
  rooms: 'navRooms',
  courses: 'navCourses',
  conflicts: 'navConflicts',
  settings: 'navSettings',
  holidays: 'navHolidays',
  'master-grid': 'navMasterGrid',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);
  const { t } = useLang();

  const segment = location.pathname.split('/')[1] || 'dashboard';
  const titleKey = PAGE_TITLE_KEYS[segment];
  const title = titleKey ? t(titleKey) : segment.charAt(0).toUpperCase() + segment.slice(1);

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';
  const displayName = user?.fullName || 'Admin';
  const roleLabels = { admin: t('roleAdmin'), timetabler: t('roleTimetabler') };
  const displayRole = roleLabels[user?.role] || t('roleUser');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <div className="h-4 w-px bg-border mx-2 hidden sm:block" />
        <span className={`hidden sm:inline-flex ${badgeNeutral}`}>
          {t('semesterBadge')}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />

        <div className={`hidden md:flex ${badgeInfo}`}>
          <HardDrive className="w-3.5 h-3.5" />
          {t('localData')}
        </div>

        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('search')}
            className="pl-9 pr-4 py-2 bg-muted/50 border-none rounded-full text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all hidden sm:block">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayRole}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-800 font-bold text-xs">
            {initials}
          </div>
          <button onClick={handleLogout} title={t('logoutTitle')}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
