import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, MapPin, Calendar,
  AlertTriangle, CheckCircle2, Clock, GraduationCap, FileText,
  Settings, Download, Circle, ChevronRight, Info
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useLang } from '../hooks/useLang';
import { badgeSuccess, badgeNeutral, panelInfo } from '../lib/uiBadges';
import { computeStats } from '../lib/stats';
import { computeQuality } from '../lib/quality';
import { generateTimetable } from '../scheduler';
import { getCourseName } from '../lib/courseUtils';
import { getWeekDayCount, getWeekDayLabels } from '../lib/weekConfig';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const groups    = useLiveQuery(() => db.groups.toArray())    || [];
  const lecturers = useLiveQuery(() => db.lecturers.toArray()) || [];
  const rooms     = useLiveQuery(() => db.rooms.toArray())     || [];
  const courses   = useLiveQuery(() => db.courses.toArray())   || [];
  const settings      = useLiveQuery(() => db.settings.toArray()) || [];
  const groupCount = groups.length, lecturerCount = lecturers.length, roomCount = rooms.length, courseCount = courses.length;

  const settingsMap = React.useMemo(() => {
    const s = {};
    settings.forEach(r => { s[r.key] = r.value; });
    return s;
  }, [settings]);

  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const sessionCount = sessions.length;

  const instType = settingsMap.institutionType || 'university';
  const numDays  = getWeekDayCount(instType, settingsMap);
  const stats = React.useMemo(() => computeStats({
    courses, lecturers, rooms, groups, sessions,
    currentWeek: settingsMap.currentWeek || '1', totalWeeks: settingsMap.totalWeeks || '35',
    institutionType: instType, numDays,
  }), [courses, lecturers, rooms, groups, sessions, settingsMap, instType, numDays]);
  const quality = React.useMemo(() => computeQuality(sessions, { lecturers, rooms, groups }), [sessions, lecturers, rooms, groups]);

  // ── What-if simulator: re-run generation on modified resources, in memory only ──
  const [sim, setSim] = React.useState({ addTeachers: 0, removeRoomId: '' });
  const [simResult, setSimResult] = React.useState(null);
  const [simRunning, setSimRunning] = React.useState(false);
  const runSim = async () => {
    setSimRunning(true); setSimResult(null);
    await new Promise(r => setTimeout(r, 60)); // let the "running" state paint
    try {
      const simLecturers = [...lecturers];
      for (let i = 0; i < sim.addTeachers; i++) {
        simLecturers.push({ id: `sim_lec_${i}`, name: `Sim ${i + 1}`, type: 'permanent', day: true, eve: true, maxHours: 18, speciality: null });
      }
      const simRooms = sim.removeRoomId ? rooms.filter(r => r.id !== sim.removeRoomId) : rooms;
      const result = generateTimetable(courses, simLecturers, simRooms, groups, instType, numDays, {
        currentWeek: settingsMap.currentWeek || '1', totalWeeks: settingsMap.totalWeeks || '35',
      });
      setSimResult(computeQuality(result, { lecturers: simLecturers, rooms: simRooms, groups }));
    } finally {
      setSimRunning(false);
    }
  };
  const dayLabels = getWeekDayLabels(numDays, lang, true);
  const conflictCount = React.useMemo(() => {
    let count = 0;
    const slotMap = {};
    sessions.forEach(s => {
      const key = `${s.day}-${s.slot}`;
      if (!slotMap[key]) slotMap[key] = { lec: {}, room: {} };
      if (s.lecId)  slotMap[key].lec[s.lecId]   = (slotMap[key].lec[s.lecId]   || 0) + 1;
      if (s.roomId) slotMap[key].room[s.roomId]  = (slotMap[key].room[s.roomId] || 0) + 1;
    });
    Object.values(slotMap).forEach(({ lec, room }) => {
      Object.values(lec).forEach(c  => { if (c > 1) count++; });
      Object.values(room).forEach(c => { if (c > 1) count++; });
    });
    return count;
  }, [sessions]);

  const isDataReady = courseCount > 0 && groupCount > 0 && lecturerCount > 0 && roomCount > 0;
  const isPdfReady  = !!(settingsMap.institutionName && settingsMap.semester);
  const hasTimetable = sessionCount > 0;

  const checklist = [
    { id: 'settings', label: t('dashStepSettings'), done: isPdfReady, path: '/settings', icon: Settings },
    { id: 'data',     label: t('dashStepData'),     done: isDataReady, path: '/groups', icon: Users },
    { id: 'generate', label: t('dashStepGenerate'), done: hasTimetable, path: '/timetable', icon: Calendar },
    { id: 'export',   label: t('dashStepExport'),   done: hasTimetable && isPdfReady, path: '/timetable', icon: Download },
  ];

  const allDone = checklist.every(c => c.done);
  const nextStep = checklist.find(c => !c.done);

  const statCards = [
    { title: t('dashStatGroups'),    value: groupCount,    icon: Users,         color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { title: t('dashStatLecturers'), value: lecturerCount, icon: BookOpen,      color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { title: t('dashStatRooms'),     value: roomCount,     icon: MapPin,        color: 'text-accent-500',  bg: 'bg-accent-500/10' },
    { title: t('dashStatCourses'),   value: courseCount,   icon: GraduationCap, color: 'text-teal-500',    bg: 'bg-teal-500/10' },
    { title: t('dashStatSessions'),  value: sessionCount,  icon: Calendar,      color: 'text-purple-500',  bg: 'bg-purple-500/10' },
    { title: t('dashStatConflicts'), value: conflictCount, icon: AlertTriangle, color: conflictCount > 0 ? 'text-destructive' : 'text-slate-700', bg: conflictCount > 0 ? 'bg-destructive/10' : 'bg-slate-200/60' },
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className={panelInfo}>
        <FileText className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{t('dashShareTitle')}</p>
          <p className="text-muted-foreground mt-1">{t('dashShareBody')}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 text-sm">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">{t('dashHowItWorksTitle')}</p>
          <ul className="text-muted-foreground mt-2 space-y-1 list-none">
            <li>{t('dashHowItWorks1')}</li>
            <li>{t('dashHowItWorks2')}</li>
            <li>{t('dashHowItWorks3')}</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2 italic">{t('dashDemoNote')}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('dashTitle')}</h2>
          <p className="text-muted-foreground mt-1">
            {allDone ? t('dashSubtitleReady') : t('dashSubtitleSteps')}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={hasTimetable ? badgeSuccess : badgeNeutral}>
          <CheckCircle2 className="w-4 h-4" />
          {hasTimetable ? t('dashActive') : t('dashReady')}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">{t('dashChecklistTitle')}</h3>
        <div className="space-y-3">
          {checklist.map((step, i) => {
            const Icon = step.icon;
            return (
              <button key={step.id} onClick={() => navigate(step.path)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                  step.done ? 'border-slate-300 bg-slate-50' : 'border-border hover:border-primary/30'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-slate-800 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className={`flex-1 text-sm font-medium ${step.done ? 'text-slate-800' : 'text-foreground'}`}>
                  {step.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
        {nextStep && !allDone && (
          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-primary text-primary" />
            {t('dashNextStep')} {nextStep.label}
          </p>
        )}
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={item}
            className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className="flex flex-col gap-3 relative z-10">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Analytics (only once a timetable exists) ── */}
      {hasTimetable && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <h3 className="text-lg font-bold text-foreground">{t('dashAnalytics')}</h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={t('dashSemesterProgress')} value={`${stats.semesterPct}%`} sub={t('dashWeekOf', stats.currentWeek, stats.totalWeeks)} />
            <KpiCard label={t('dashWeeklyHours')} value={`${stats.totalHours} h`} />
            <KpiCard label={t('dashAvgRoomUse')} value={`${stats.avgRoomUtil}%`} />
            <KpiCard label={t('dashOverloaded')} value={stats.overloadedTeachers} danger={stats.overloadedTeachers > 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatPanel title={t('dashSubjectCoverage')} hint={t('dashSubjectCoverageHint')}>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {stats.subjectProgress.map(s => (
                  <BarRow key={s.id} label={s.code} sub={getCourseName(s, lang)} right={`${s.done}/${s.total}`} pct={s.pct} />
                ))}
              </div>
            </StatPanel>
            <StatPanel title={t('dashTeacherLoad')} hint={t('dashTeacherLoadHint')}>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {stats.teacherLoad.map(tl => (
                  <BarRow key={tl.id} label={tl.name} right={`${tl.hours}/${tl.max || '∞'}h`} pct={Math.min(100, tl.pct)} danger={tl.over} />
                ))}
              </div>
            </StatPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatPanel title={t('dashRoomUse')} hint={t('dashRoomUseHint')}>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {stats.roomUtil.map(r => (
                  <BarRow key={r.id} label={r.name} right={`${r.pct}%`} pct={r.pct} />
                ))}
              </div>
            </StatPanel>
            <StatPanel title={t('dashSessionsByDay')}>
              <DayChart data={stats.byDay} labels={dayLabels} />
            </StatPanel>
          </div>

          {/* Quality score + Fairness */}
          {quality && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatPanel title={t('dashQuality')} hint={t('dashQualityScore')}>
                <div className="flex items-center gap-5">
                  <div className="shrink-0 w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: `conic-gradient(${quality.score >= 85 ? '#10b981' : quality.score >= 60 ? '#f59e0b' : '#ef4444'} ${quality.score * 3.6}deg, #e2e8f0 0deg)` }}>
                    <div className="w-[78px] h-[78px] rounded-full bg-card flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-foreground leading-none">{quality.score}</span>
                      <span className="text-[9px] text-muted-foreground">/100</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {quality.breakdown.filter(b => b.show).map(b => (
                      <BarRow key={b.key} label={t(b.key)} right={`${b.pct}%`} pct={b.pct} danger={b.pct < 60} />
                    ))}
                  </div>
                </div>
              </StatPanel>

              <StatPanel title={t('dashFairness')}>
                <div className="space-y-3">
                  <BarRow label={t('dashBalance')} right={`${quality.fairness.balance}%`} pct={quality.fairness.balance} danger={quality.fairness.balance < 50} />
                  {quality.fairness.busiest && (
                    <div className="flex items-center justify-between text-sm px-3 py-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground">{t('dashBusiest')}</span>
                      <span className="font-medium text-foreground">{quality.fairness.busiest.name} · {quality.fairness.busiest.hours}h</span>
                    </div>
                  )}
                  {quality.fairness.lightest && quality.fairness.lightest !== quality.fairness.busiest && (
                    <div className="flex items-center justify-between text-sm px-3 py-2 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground">{t('dashLightest')}</span>
                      <span className="font-medium text-foreground">{quality.fairness.lightest.name} · {quality.fairness.lightest.hours}h</span>
                    </div>
                  )}
                  {quality.fairness.worstClass && (
                    <div className="flex items-center justify-between text-sm px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <span className="text-amber-700">{t('dashWorstClass')}</span>
                      <span className="font-medium text-amber-700">{quality.fairness.worstClass.name} · {t('dashGapsN', quality.fairness.worstClass.gaps)}</span>
                    </div>
                  )}
                </div>
              </StatPanel>
            </div>
          )}

          {/* What-if simulator */}
          {quality && (
            <StatPanel title={t('dashWhatIf')} hint={t('dashWhatIfHint')}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button onClick={() => setSim(s => ({ ...s, addTeachers: s.addTeachers + 1 }))}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/50">
                  {t('dashSimAddTeacher')}{sim.addTeachers > 0 ? ` ×${sim.addTeachers}` : ''}
                </button>
                <select value={sim.removeRoomId} onChange={e => setSim(s => ({ ...s, removeRoomId: e.target.value }))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs">
                  <option value="">{t('dashSimRemoveRoom')}…</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>− {r.name}</option>)}
                </select>
                <button onClick={() => { setSim({ addTeachers: 0, removeRoomId: '' }); setSimResult(null); }}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/50">{t('dashSimReset')}</button>
                <button onClick={runSim} disabled={simRunning || (sim.addTeachers === 0 && !sim.removeRoomId)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {simRunning ? t('dashSimRunning') : t('dashSimRun')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SimCard label={t('dashSimCurrent')} score={quality.score} clashes={quality.clashes} overloaded={quality.overloaded} t={t} />
                <SimCard label={t('dashSimProjected')} score={simResult?.score} clashes={simResult?.clashes} overloaded={simResult?.overloaded} pending={simRunning} empty={!simResult && !simRunning} t={t} />
              </div>
            </StatPanel>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">{t('dashGenTitle')}</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {sessionCount > 0 ? t('dashGenSessions', sessionCount) : t('dashGenNotYet')}
            </span>
          </div>
          <div className="bg-primary-950 rounded-xl p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">
                  {isDataReady ? t('dashGenReady') : t('dashGenMissing')}
                </h4>
                <p className="text-primary-200 text-sm max-w-md">
                  {isDataReady
                    ? t('dashGenReadyDetail', groupCount, lecturerCount, courseCount, roomCount)
                    : t('dashGenMissingDetail')}
                </p>
              </div>
              <button onClick={() => navigate(isDataReady ? '/timetable' : '/groups')}
                className="whitespace-nowrap bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-accent-500/25 transition-all hover:scale-105 active:scale-95">
                {sessionCount > 0 ? t('dashGenBtnView') : isDataReady ? t('dashGenBtnGo') : t('navGroups')}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">{t('dashConflictsTitle')}</h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              conflictCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-slate-200 text-slate-800'
            }`}>{conflictCount}</div>
          </div>
          {conflictCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="font-semibold text-foreground">{t('dashNoConflicts')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {sessionCount > 0 ? t('dashNoConflictsOk') : t('dashNoConflictsFirst')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
              <h4 className="font-semibold text-foreground">{t('dashConflictsCount', conflictCount)}</h4>
              <button onClick={() => navigate('/conflicts')}
                className="mt-3 text-xs text-primary font-semibold hover:underline">
                {t('dashConflictsFix')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Analytics building blocks ───────────────────────────────────

function KpiCard({ label, value, sub, danger }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${danger ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatPanel({ title, hint, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="font-bold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">{hint || ' '}</p>
      {children}
    </div>
  );
}

function BarRow({ label, sub, right, pct, danger }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="font-medium text-foreground truncate" title={sub || label}>
          {label}{sub && <span className="text-muted-foreground font-normal"> · {sub}</span>}
        </span>
        <span className={`font-mono shrink-0 ${danger ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>{right}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function DayChart({ data, labels }) {
  const max = Math.max(1, ...data);
  const CHART_H = 130; // px — explicit so bar heights are reliable inside flex
  return (
    <div className="flex items-end justify-between gap-2" style={{ minHeight: CHART_H + 34 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-bold text-foreground">{v}</span>
          <div className="w-full bg-emerald-500 rounded-t-md" style={{ height: v > 0 ? Math.max(4, Math.round((v / max) * CHART_H)) : 0 }} />
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function SimCard({ label, score, clashes, overloaded, pending, empty, t }) {
  const color = score == null ? 'text-muted-foreground' : score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="border border-border rounded-xl p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      {pending ? (
        <p className="text-3xl font-bold text-muted-foreground animate-pulse">…</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground py-2">—</p>
      ) : (
        <>
          <p className={`text-3xl font-bold ${color}`}>{score}<span className="text-sm text-muted-foreground">/100</span></p>
          <p className={`text-xs mt-1 ${clashes > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}`}>
            {clashes > 0 ? t('dashSimClashesN', clashes) : t('dashNoConflicts')}
          </p>
          <p className={`text-xs mt-0.5 ${overloaded > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {overloaded} {t('dashOverloaded').toLowerCase()}
          </p>
        </>
      )}
    </div>
  );
}
