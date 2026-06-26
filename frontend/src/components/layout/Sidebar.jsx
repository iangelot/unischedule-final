import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, BookOpen, MapPin,
  AlertTriangle, GraduationCap, Settings, LogOut,
  CalendarX, LayoutGrid, History,
} from 'lucide-react';
import AppLogo from '../AppLogo';
import { useAppStore } from '../../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useLang } from '../../hooks/useLang';

const navGroups = [
  {
    labelKey: 'navPlanning',
    items: [
      { path: '/dashboard',    labelKey: 'navDashboard',   icon: LayoutDashboard },
      { path: '/timetable',         labelKey: 'navTimetable',  icon: Calendar },
      { path: '/timetable-history', labelKey: 'navHistory',    icon: History, badgeKey: 'history' },
      { path: '/master-grid',       labelKey: 'navMasterGrid', icon: LayoutGrid },
      { path: '/conflicts',    labelKey: 'navConflicts',   icon: AlertTriangle, badgeKey: 'conflicts' },
    ],
  },
  {
    labelKey: 'navData',
    items: [
      { path: '/groups',    labelKey: 'navGroups',    icon: Users },
      { path: '/lecturers', labelKey: 'navLecturers', icon: BookOpen },
      { path: '/rooms',     labelKey: 'navRooms',     icon: MapPin },
      { path: '/courses',   labelKey: 'navCourses',   icon: GraduationCap },
      { path: '/holidays',  labelKey: 'navHolidays',  icon: CalendarX },
    ],
  },
];

export default function Sidebar() {
  const logout   = useAppStore(state => state.logout);
  const navigate = useNavigate();
  const { t } = useLang();

  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const historyCount = useLiveQuery(async () => {
    await db.open();
    return db.timetableSnapshots.count();
  }) ?? 0;
  const conflictCount = React.useMemo(() => {
    let count = 0;
    const slotMap = {};
    sessions.forEach(s => {
      const key = `${s.day}-${s.slot}`;
      if (!slotMap[key]) slotMap[key] = { lec: {}, room: {} };
      if (s.lecId)  slotMap[key].lec[s.lecId]  = (slotMap[key].lec[s.lecId]  || 0) + 1;
      if (s.roomId) slotMap[key].room[s.roomId] = (slotMap[key].room[s.roomId] || 0) + 1;
    });
    Object.values(slotMap).forEach(({ lec, room }) => {
      Object.values(lec).forEach(c  => { if (c > 1) count++; });
      Object.values(room).forEach(c => { if (c > 1) count++; });
    });
    return count;
  }, [sessions]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-primary-950 text-primary-100 flex flex-col h-screen border-r border-primary-900/50">
      <div className="h-20 flex items-center px-3 border-b border-primary-900/50">
        <div className="w-full flex items-center justify-center bg-white rounded-xl px-4 py-2.5 shadow-md">
          <AppLogo size="lg" className="max-w-[190px]" />
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.labelKey}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-3">
              {t(group.labelKey)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-900 text-white shadow-sm ring-1 ring-primary-800'
                        : 'text-slate-300 hover:bg-primary-900/50 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 opacity-80 group-hover:opacity-100 shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </div>
                  {item.badgeKey === 'conflicts' && conflictCount > 0 && (
                    <span className="bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center shrink-0">
                      {conflictCount}
                    </span>
                  )}
                  {item.badgeKey === 'history' && historyCount > 0 && (
                    <span className="bg-white text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center shrink-0">
                      {historyCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-900/50 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
              isActive ? 'bg-primary-900 text-white' : 'text-slate-300 hover:bg-primary-900/50 hover:text-white'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          {t('navSettings')}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {t('navLogout')}
        </button>
      </div>
    </aside>
  );
}
