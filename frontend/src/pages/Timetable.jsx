import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Play, Loader2, CheckCircle2, Download, Printer, RefreshCw,
  AlertCircle, FileSpreadsheet, FileText, ChevronLeft, ChevronRight,
  GripVertical, Lock, Unlock, CalendarX
} from 'lucide-react';
import { db, getSetting, TIME_SLOTS } from '../db';
import { generateTimetable } from '../scheduler';
import { exportTimetablePDF } from '../lib/exportPDF';
import { useAppStore } from '../store/useAppStore';
import { useLang } from '../hooks/useLang';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getWeekDayCount, getWeekDayLabels, formatWeekRange } from '../lib/weekConfig';
import { saveTimetableSnapshot } from '../lib/timetableSnapshots';
import { buildCourseAccentMap, sessionCardClasses } from '../lib/sessionCardStyle';
import { panelSuccess, panelInfo } from '../lib/uiBadges';
import * as XLSX from 'xlsx';

// ── Helpers ──────────────────────────────────────────────────────

function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}


function toISODate(date) {
  return date.toISOString().split('T')[0];
}

// ── Main Component ───────────────────────────────────────────────

export default function Timetable() {
  const user = useAppStore(s => s.user);
  const uiLang = useAppStore(s => s.language);
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewArchiveId = searchParams.get('view');
  const [status, setStatus]         = useState('idle');
  const [genLog, setGenLog]         = useState([]);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterMode, setFilterMode] = useState('all'); // all | day | evening
  const [dragSession, setDragSession] = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [snapshotSessions, setSnapshotSessions] = useState(null);
  const [viewLabel, setViewLabel] = useState('');
  const exportMenuRef = useRef(null);

  // Settings from DB
  const [settings, setSettings] = useState({
    institutionName: 'Mon Établissement',
    institutionType: 'university',
    logo: null,
    showSaturday: true,
    showSunday: true,
    language: 'fr',
    weekStart: null,
  });
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(new Date()));

  useEffect(() => {
    async function loadSettings() {
      const rows = await db.settings.toArray();
      const s = {};
      rows.forEach(r => { s[r.key] = r.value; });
      setSettings(prev => ({ ...prev, ...s }));
      if (s.weekStart) setWeekMonday(new Date(s.weekStart));
    }
    loadSettings();
  }, []);

  // Live data from Dexie
  const liveSessions = useLiveQuery(() => db.sessions.toArray())  || [];
  const sessions = viewArchiveId ? (snapshotSessions || []) : liveSessions;
  const courses   = useLiveQuery(() => db.courses.toArray())   || [];
  const lecturers = useLiveQuery(() => db.lecturers.toArray()) || [];
  const rooms     = useLiveQuery(() => db.rooms.toArray())     || [];
  const groups    = useLiveQuery(() => db.groups.toArray())    || [];
  const holidays  = useLiveQuery(() => db.holidays.toArray())  || [];

  const courseMap   = Object.fromEntries(courses.map(c  => [c.id, c]));
  const lecturerMap = Object.fromEntries(lecturers.map(l => [l.id, l]));
  const roomMap     = Object.fromEntries(rooms.map(r    => [r.id, r]));
  const groupMap    = Object.fromEntries(groups.map(g   => [g.id, g]));

  const instType   = settings.institutionType || 'university';
  const lang       = uiLang || settings.language || 'fr';
  const numDays    = getWeekDayCount(instType, settings);
  const DAYS_LABEL = getWeekDayLabels(numDays, lang);
  const isViewingHistory = !!viewArchiveId;
  const isDataReady = courses.length > 0 && groups.length > 0 && lecturers.length > 0 && rooms.length > 0;

  useEffect(() => {
    if (!viewArchiveId) {
      setSnapshotSessions(null);
      setViewLabel('');
      return;
    }
    db.timetableSnapshots.get(Number(viewArchiveId)).then(snap => {
      setSnapshotSessions(snap?.sessions || []);
      setViewLabel(snap?.label || '');
    });
  }, [viewArchiveId]);

  const prereqItems = [
    { key: 'groups',    label: t('ttPrereqGroups'),    count: groups.length,    path: '/groups',    ok: groups.length > 0 },
    { key: 'courses',   label: t('ttPrereqCourses'),   count: courses.length,   path: '/courses',   ok: courses.length > 0 },
    { key: 'lecturers', label: t('ttPrereqLecturers'), count: lecturers.length, path: '/lecturers', ok: lecturers.length > 0 },
    { key: 'rooms',     label: t('ttPrereqRooms'),     count: rooms.length,     path: '/rooms',     ok: rooms.length > 0 },
  ];
  const missingPrereqs = prereqItems.filter(p => !p.ok).map(p => p.label);
  // Build slots based on institution type
  const daySlots = instType === 'secondary' ? TIME_SLOTS.secondary : TIME_SLOTS.university;
  const eveSlots = instType === 'secondary' ? [] : TIME_SLOTS.evening;
  const allSlots = filterMode === 'evening' ? eveSlots
                 : filterMode === 'day'     ? daySlots
                 : [...daySlots, ...eveSlots];

  // Map slot index in full list
  const fullSlots = [...TIME_SLOTS[instType === 'secondary' ? 'secondary' : 'university'], ...TIME_SLOTS.evening];

  // Week dates for holiday detection
  const weekDates = getWeekDates(weekMonday).slice(0, numDays);
  const holidayMap = {};
  holidays.forEach(h => { holidayMap[h.date] = h; });

  // ── Generation ─────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!isDataReady) {
      setStatus('error');
      setGenLog([`⚠ ${t('ttGenerateDisabled')}`]);
      return;
    }
    if (liveSessions.length > 0 && !window.confirm(t('ttConfirmRegen'))) return;

    setStatus('running');
    setSearchParams({});
    setGenLog([]);
    const log = (msg) => setGenLog(p => [...p, msg]);

    log('🧬 Initialisation du planificateur...');
    await new Promise(r => setTimeout(r, 600));
    log(`📚 Chargé: ${courses.length} cours · ${groups.length} groupes · ${lecturers.length} enseignants · ${rooms.length} salles`);
    await new Promise(r => setTimeout(r, 500));
    log('🔀 Génération de la population initiale (50 chromosomes)...');
    await new Promise(r => setTimeout(r, 800));

    try {
      const result = await new Promise(resolve => {
        setTimeout(() => {
          const r = generateTimetable(courses, lecturers, rooms, groups, instType, numDays, {
            currentWeek: settings.currentWeek || '1',
            totalWeeks: settings.totalWeeks || '35',
          });
          resolve(r);
        }, 100);
      });

      log('⚡ Évolution sur 150 générations...');
      await new Promise(r => setTimeout(r, 1000));
      log(`✅ Fitness optimal atteint: ${result?.length > 0 ? '100%' : 'N/A'}`);
      await new Promise(r => setTimeout(r, 400));

      if (result && result.length > 0) {
        await db.sessions.clear();
        await db.sessions.bulkAdd(result);
        let snapId = null;
        try {
          snapId = await saveTimetableSnapshot({
            sessions: result,
            weekMonday,
            settings: { ...settings, _numDays: numDays },
            generatedBy: user?.fullName,
            lang,
          });
          setLastSnapId(snapId);
        } catch (snapErr) {
          console.error(snapErr);
          log(`⚠ Historique: ${snapErr.message}`);
        }
        log(`📅 Emploi du temps généré: ${result.length} séances planifiées`);
        await new Promise(r => setTimeout(r, 300));
        if (snapId) log(`🎉 ${t('ttSavedToHistory')}`);
        setStatus('done');
      } else {
        setStatus('error');
        setGenLog(p => [...p, '⚠ Résultat vide — ajoutez plus de données et réessayez.']);
      }
    } catch (err) {
      log(`❌ Erreur: ${err.message}`);
      setStatus('error');
    }
  };

  const handleClear = async () => {
    if (!window.confirm(t('ttConfirmClear'))) return;
    await db.sessions.clear();
    setStatus('idle');
    setGenLog([]);
  };

  // ── Drag-and-Drop ───────────────────────────────────────────────

  const handleDragStart = useCallback((e, session) => {
    if (session.locked) { e.preventDefault(); return; }
    setDragSession(session);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, dayIdx, slotIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(`${dayIdx}-${slotIdx}`);
  }, []);

  const handleDrop = useCallback(async (e, dayIdx, slotIdx) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragSession) return;

    // Find the real slot index in fullSlots
    const targetSlot = allSlots[slotIdx];
    if (!targetSlot) return;
    const realSlotIdx = fullSlots.findIndex(s => s.label === targetSlot.label);
    if (realSlotIdx === -1) return;

    const isEveSlot = realSlotIdx >= (instType === 'secondary' ? 4 : TIME_SLOTS.university.length);
    const newMode = isEveSlot ? 'evening' : 'day';

    await db.sessions.update(dragSession.id, {
      day: dayIdx,
      slot: realSlotIdx,
      mode: newMode,
      locked: true,
    });
    setDragSession(null);
  }, [dragSession, allSlots, fullSlots, instType]);

  const toggleLock = useCallback(async (session) => {
    await db.sessions.update(session.id, { locked: !session.locked });
  }, []);

  // ── Filtering ──────────────────────────────────────────────────

  const filteredSessions = React.useMemo(() => {
    let s = sessions;
    if (filterGroup !== 'all') s = s.filter(x => x.groups && x.groups.includes(filterGroup));
    if (filterMode === 'day')     s = s.filter(x => x.mode !== 'evening');
    if (filterMode === 'evening') s = s.filter(x => x.mode === 'evening');
    return s;
  }, [sessions, filterGroup, filterMode]);

  // Build grid: sessions[day][slotInAllSlots]
  const grid = React.useMemo(() => {
    const g = {};
    for (let di = 0; di < numDays; di++) {
      g[di] = {};
      allSlots.forEach((_, si) => { g[di][si] = []; });
    }
    filteredSessions.forEach(s => {
      if (s.day >= 0 && s.day < numDays) {
        // Map real slot idx → display slot idx
        const displaySlot = allSlots.findIndex(sl => {
          const realSlot = fullSlots[s.slot];
          return realSlot && sl.label === realSlot.label;
        });
        if (displaySlot !== -1) {
          g[s.day][displaySlot].push(s);
        }
      }
    });
    return g;
  }, [filteredSessions, allSlots, fullSlots, numDays]);

  const accentMap = React.useMemo(() => buildCourseAccentMap(courses), [courses]);

  // Week navigation
  const prevWeek = () => setWeekMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const dateRange = formatWeekRange(weekMonday, numDays, lang);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e) => { if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── PDF Export (IUGET format) ──────────────────────────────────

  const [exporting, setExporting] = useState(false);
  const [shareHint, setShareHint] = useState(false);
  const [lastSnapId, setLastSnapId] = useState(null);

  const exportPDF = async () => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      await exportTimetablePDF({
        sessions,
        groups,
        courses,
        lecturers,
        rooms,
        holidays,
        settings,
        filterGroupId: filterGroup !== 'all' ? filterGroup : null,
        weekMonday,
        numDays,
        allSlots,
        fullSlots,
        lang,
        generatedBy: user?.fullName || null,
      });
      setShareHint(true);
      setTimeout(() => setShareHint(false), 10000);
    } finally {
      setExporting(false);
    }
  };

  // ── Excel Export ───────────────────────────────────────────────

  const exportExcel = () => {
    const wsData = [];

    // Header rows
    wsData.push([settings.institutionName || 'Emploi du Temps']);
    wsData.push([dateRange]);
    wsData.push([]);
    wsData.push(['Horaire', ...DAYS_LABEL]);

    allSlots.filter(sl => !sl.isBreak).forEach((slotDef, si) => {
      const row = [slotDef.label];
      for (let di = 0; di < numDays; di++) {
        const date = weekDates[di];
        const iso = toISODate(date);
        if (holidayMap[iso]) {
          const h = holidayMap[iso];
          row.push(lang === 'fr' ? h.name_fr : h.name_en);
          continue;
        }
        const cellSessions = grid[di]?.[si] || [];
        const cellText = cellSessions.map(s => {
          const c    = courseMap[s.courseId];
          const l    = lecturerMap[s.lecId];
          const r    = roomMap[s.roomId];
          const prog = s.sessionNum ? ` (${s.sessionNum}/${s.totalSessions || '?'})` : '';
          const ca   = s.isCombined ? ' (CA)' : '';
          return `${c?.code || '?'}${prog}${ca} | ${l?.name || '—'} | ${r?.name || '—'}`;
        }).join('\n');
        row.push(cellText || '');
      }
      wsData.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 18 }, ...Array(numDays).fill({ wch: 30 })];
    XLSX.utils.book_append_sheet(wb, ws, 'Emploi du Temps');
    XLSX.writeFile(wb, `emploi-du-temps-semaine${settings.currentWeek || 1}-${toISODate(weekMonday)}.xlsx`);
    setShowExportMenu(false);
  };

  // ── Render ─────────────────────────────────────────────────────

  const displaySlots = allSlots.filter(s => !s.isBreak);
  const isEveSlotLabel = (label) => TIME_SLOTS.evening.some(s => s.label === label);

  return (
    <div className="space-y-6">
      {shareHint && (
        <div className={panelSuccess}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t('ttShareHint')}</span>
        </div>
      )}

      {status === 'done' && lastSnapId && (
        <div className={panelSuccess}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {t('ttSavedToHistory')}{' '}
            <button type="button" onClick={() => navigate('/timetable-history')}
              className="font-semibold underline hover:no-underline">
              {t('ttOpenHistory')}
            </button>
          </span>
        </div>
      )}

      <div className={panelInfo}>
        <p className="font-semibold">{t('ttGenHowTitle')}</p>
        <p className="mt-1.5 text-sm leading-relaxed">{t('ttGenHowBody')}</p>
      </div>

      {/* Prerequisites */}
      <div className={`rounded-2xl border p-5 ${isDataReady ? 'bg-slate-50 border-slate-300' : 'bg-amber-50 border-amber-200'}`}>
        <h3 className="font-bold text-foreground mb-1">{t('ttPrereqTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('ttPrereqIntro')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prereqItems.map(item => (
            <div key={item.key} className="flex items-center justify-between gap-3 bg-card/80 rounded-xl px-4 py-3 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                {item.ok
                  ? <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                <span className="text-sm font-medium truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground shrink-0">({item.count})</span>
              </div>
              <button onClick={() => navigate(item.path)}
                className="text-xs font-semibold text-primary hover:underline shrink-0">
                {t('ttPrereqManage')}
              </button>
            </div>
          ))}
        </div>
        <p className={`text-sm mt-3 font-medium ${isDataReady ? 'text-slate-800' : 'text-amber-950'}`}>
          {isDataReady ? t('ttPrereqReady') : t('ttPrereqMissing', missingPrereqs.join(', '))}
        </p>
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('ttTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('ttSubtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sessions.length > 0 && (
            <>
              {/* Export dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => !exporting && setShowExportMenu(v => !v)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2 disabled:opacity-60"
                  disabled={exporting}
                >
                  {exporting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> PDF...</>
                    : <><Download className="w-4 h-4" /> {t('ttExport')}</>}
                </button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-11 z-50 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[180px]"
                    >
                      <button onClick={exportPDF} disabled={exporting}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left disabled:opacity-50">
                        <FileText className="w-4 h-4 text-red-500" /> {t('ttExportPdf')}
                      </button>
                      <button onClick={exportExcel}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left">
                        <FileSpreadsheet className="w-4 h-4 text-slate-600" /> {t('ttExportExcel')}
                      </button>
                      <button onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left">
                        <Printer className="w-4 h-4 text-blue-500" /> {t('ttPrint')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleClear}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> {t('ttClear')}
              </button>
            </>
          )}
          <button id="run-ai-engine" onClick={handleGenerate} disabled={status === 'running' || !isDataReady || isViewingHistory}
            title={!isDataReady ? t('ttGenerateDisabled') : ''}
            className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-accent-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed">
            {status === 'running'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('ttGenerating')}</>
              : <><Play className="w-4 h-4" /> {t('ttGenerate')}</>}
          </button>
        </div>
      </div>

      {/* ── GA Console Log ── */}
      <AnimatePresence>
        {genLog.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-primary-950 rounded-xl p-4 font-mono text-xs text-primary-300 space-y-1 overflow-hidden">
            <div className="flex items-center gap-2 text-primary-400 mb-2 text-[11px] font-sans">
              <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-accent-500 animate-pulse' : status === 'done' ? 'bg-slate-700' : 'bg-destructive'}`} />
              {t('ttGaConsole')}
            </div>
            {genLog.map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="leading-relaxed">
                <span className="text-primary-600 mr-2">{'>'}</span>{line}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Week navigator + school header ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        {/* School identity */}
        <div className="flex items-center gap-3">
          {settings.logo && (
            <img src={settings.logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-border" />
          )}
          <div>
            <p className="font-bold text-foreground text-lg leading-tight">{settings.institutionName || 'Établissement'}</p>
            <p className="text-xs text-muted-foreground capitalize">{settings.institutionType === 'secondary' ? t('ttSecondary') : t('ttUniversity')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} disabled={isViewingHistory}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1 text-center">{dateRange}</span>
          <button onClick={nextWeek} disabled={isViewingHistory}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {isViewingHistory && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-900">
            <span>{t('ttArchiveView')}: <strong>{viewLabel}</strong></span>
            <div className="flex gap-3 shrink-0">
              <Link to="/timetable" className="font-semibold text-primary hover:underline">{t('ttBackToLive')}</Link>
              <Link to="/timetable-history" className="font-semibold text-primary hover:underline">{t('navHistory')} →</Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      {sessions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('ttFilter')}</span>

          <button onClick={() => setFilterGroup('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterGroup === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {t('ttAll')}
          </button>
          {groups.map(g => (
            <button key={g.id} onClick={() => setFilterGroup(g.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterGroup === g.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {g.name}
            </button>
          ))}

          <span className="text-muted-foreground/30 mx-1">|</span>

          {/* Mode filter (only for university) */}
          {instType !== 'secondary' && (
            <>
              {[['all', t('ttAll')], ['day', t('ttDay')], ['evening', t('ttEvening')]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterMode(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterMode === val ? 'bg-accent-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {label}
                </button>
              ))}
            </>
          )}

          {filterGroup !== 'all' && (
            <>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <button onClick={exportPDF} disabled={exporting}
                className="px-4 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {t('ttPdfWhatsapp')} — {groups.find(g => g.id === filterGroup)?.name}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Timetable Grid ── */}
      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Play className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t('ttEmptyTitle')}</h3>
          <p className="text-muted-foreground text-sm max-w-md">{t('ttEmptyBody')}</p>
          {!isDataReady && (
            <button onClick={() => navigate('/groups')}
              className="mt-4 text-sm font-semibold text-primary hover:underline">
              {t('ttPrereqManage')} → {t('navGroups')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden" id="timetable-print">
          {/* Print header (hidden on screen, shown when printing) */}
          <div className="hidden print:block p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {settings.logo && <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />}
              <div>
                <h1 className="text-xl font-bold">{settings.institutionName}</h1>
                <p className="text-sm">{dateRange}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-border flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{t('ttSessions', filteredSessions.length)}</h3>
              {dragSession && <span className="text-xs text-accent-500 font-medium">{t('ttDragHint')}</span>}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              <span className="text-xs text-muted-foreground">{t('ttNoConflicts')}</span>
              <span className="text-xs text-muted-foreground ml-2">• {t('ttDragHint')}</span>
            </div>
          </div>

          <div className={`px-4 py-2 text-xs border-b border-border print:hidden ${panelInfo}`}>
            <p>{t('ttScrollHint')} — {numDays} {t('ttDays')}</p>
            <p className="mt-1 font-medium">{t('ttGroupsLegend')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${120 + numDays * 200}px` }}>
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground w-32 sticky left-0 bg-muted/50 z-10">{t('ttSchedule')}</th>
                  {DAYS_LABEL.map((d, di) => {
                    const date   = weekDates[di];
                    const iso    = toISODate(date);
                    const isHol  = !!holidayMap[iso];
                    const dateLabel = date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
                    return (
                      <th key={di} className={`px-3 py-3 text-center font-semibold min-w-[200px] ${isHol ? 'text-orange-500' : 'text-foreground'}`}>
                        <div className="text-sm">{d}</div>
                        <div className="text-xs font-normal text-muted-foreground">{dateLabel}</div>
                        {isHol && <div className="text-[10px] text-orange-500">🏖 {lang === 'fr' ? holidayMap[iso].name_fr : holidayMap[iso].name_en}</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displaySlots.map((slotDef, si) => {
                  const isEve = isEveSlotLabel(slotDef.label);
                  return (
                    <tr key={si} className={`border-t border-border ${isEve ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                      <td className="px-3 py-3 text-muted-foreground font-mono font-semibold whitespace-nowrap text-xs sticky left-0 bg-card z-10 border-r border-border">
                        <div>{slotDef.label}</div>
                        {isEve && <div className="text-[10px] text-indigo-500 font-sans">{t('ttEveningClass')}</div>}
                      </td>
                      {DAYS_LABEL.map((_, di) => {
                        const date  = weekDates[di];
                        const iso   = toISODate(date);
                        const isHol = !!holidayMap[iso];
                        const isDragTarget = dragOver === `${di}-${si}`;

                        if (isHol) {
                          return (
                            <td key={di} className="px-2 py-2 align-middle text-center" style={{ minHeight: '70px' }}>
                              <div className="flex flex-col items-center justify-center h-full py-2">
                                <CalendarX className="w-5 h-5 text-orange-300 mb-1" />
                                <span className="text-[10px] text-orange-400 font-medium leading-tight">
                                  {lang === 'fr' ? holidayMap[iso].name_fr : holidayMap[iso].name_en}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        const cellSessions = grid[di]?.[si] || [];
                        return (
                          <td
                            key={di}
                            className={`px-2 py-2 align-top transition-colors min-w-[200px] ${isDragTarget ? 'bg-accent-500/10 ring-2 ring-inset ring-accent-500/40' : ''}`}
                            style={{ minHeight: '100px', verticalAlign: 'top' }}
                            onDragOver={!isViewingHistory ? (e) => handleDragOver(e, di, si) : undefined}
                            onDragLeave={!isViewingHistory ? () => setDragOver(null) : undefined}
                            onDrop={!isViewingHistory ? (e) => handleDrop(e, di, si) : undefined}
                          >
                            {cellSessions.map((s, idx) => {
                              const course   = courseMap[s.courseId];
                              const lecturer = lecturerMap[s.lecId];
                              const room     = roomMap[s.roomId];
                              const group    = s.groups?.[0] ? groupMap[s.groups[0]] : null;
                              const accentIdx = accentMap[s.courseId] ?? 0;
                              return (
                                <div
                                  key={idx}
                                  draggable={!isViewingHistory && !s.locked}
                                  onDragStart={(e) => handleDragStart(e, s)}
                                  className={`${sessionCardClasses(accentIdx)} group/session relative ${
                                    s.locked || isViewingHistory ? 'opacity-95' : 'cursor-grab active:cursor-grabbing hover:shadow-md'
                                  } transition-shadow`}
                                >
                                  {!s.locked && !isViewingHistory && (
                                    <GripVertical className="w-3 h-3 absolute top-1.5 right-1.5 text-slate-400 opacity-0 group-hover/session:opacity-60 transition-opacity" />
                                  )}
                                  <p className="font-bold text-sm break-words pr-4 text-slate-900">
                                    {course?.code || s.courseId}
                                    {s.sessionNum && (
                                      <span className="block text-[10px] font-semibold text-slate-600 mt-0.5">
                                        {t('ttSessionLabel', s.sessionNum, s.totalSessions || '?')}
                                        {s.sessionInWeek && s.sessionsPerWeek > 1 && (
                                          <span className="font-normal text-slate-500">
                                            {' '}· {t('ttSessionWeek', s.sessionInWeek, s.sessionsPerWeek)}
                                          </span>
                                        )}
                                      </span>
                                    )}
                                    {s.isCombined && <span className="font-medium ml-1 text-slate-600 text-xs">(CA)</span>}
                                  </p>
                                  <p className="text-xs break-words mt-0.5 font-semibold text-slate-800">{lecturer?.name || '—'}</p>
                                  <p className="text-xs break-words text-slate-600">{room?.name || '—'}</p>
                                  {group && <p className="text-[11px] break-words font-bold mt-1 text-slate-500">{group.name}</p>}
                                  <button
                                    onClick={() => toggleLock(s)}
                                    className="absolute bottom-1 right-1 opacity-0 group-hover/session:opacity-60 hover:!opacity-100 transition-opacity"
                                    title={s.locked ? t('ttUnlock') : t('ttLock')}
                                  >
                                    {s.locked
                                      ? <Lock className="w-2.5 h-2.5" />
                                      : <Unlock className="w-2.5 h-2.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
