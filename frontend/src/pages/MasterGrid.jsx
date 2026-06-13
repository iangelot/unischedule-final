/**
 * Master Grid — Combined multi-speciality timetable view.
 * Layout matches real IUGET timetables:
 *   Rows  = time slots
 *   Cols  = specialities, grouped under each day (with date header)
 *   Left  = Slot label column
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, CalendarX, LayoutGrid, Printer, CheckCircle2 } from 'lucide-react';
import { db, TIME_SLOTS } from '../db';
import { getWeekDayCount, getWeekDayLabels, formatWeekRange } from '../lib/weekConfig';
import { sessionCardClasses } from '../lib/sessionCardStyle';
import { panelInfo, panelSuccess } from '../lib/uiBadges';
import { useLang } from '../hooks/useLang';
import { exportTimetablePDF } from '../lib/exportPDF';
import { useAppStore } from '../store/useAppStore';
import * as XLSX from 'xlsx';

// ── Slot helpers ─────────────────────────────────────────────────

function buildAllSlots(instType) {
  const dayPart = instType === 'secondary' ? TIME_SLOTS.secondary : TIME_SLOTS.university;
  const evePart = instType === 'secondary' ? [] : TIME_SLOTS.evening;
  // Saturday slots are separate (4-hour blocks) — shown only on Saturday column, not as extra rows
  return [...dayPart, ...evePart];
}


function getMondayOfWeek(d) {
  const date = new Date(d); const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(0,0,0,0); return date;
}
function toISO(d) { return d.toISOString().split('T')[0]; }

export default function MasterGrid() {
  const user = useAppStore(s => s.user);
  const { t } = useLang();
  const sessions  = useLiveQuery(() => db.sessions.toArray())  || [];
  const courses   = useLiveQuery(() => db.courses.toArray())   || [];
  const lecturers = useLiveQuery(() => db.lecturers.toArray()) || [];
  const rooms     = useLiveQuery(() => db.rooms.toArray())     || [];
  const groups    = useLiveQuery(() => db.groups.toArray())    || [];
  const holidays  = useLiveQuery(() => db.holidays.toArray())  || [];

  const [settings, setSettings] = useState({
    institutionName: '', schoolName: '', logo: null, logo2: null,
    language: 'fr', showSaturday: true, showSunday: true, institutionType: 'university',
    currentWeek: '1', totalWeeks: '35', semester: '', cohort: '',
    city: 'Douala', directorTitle: 'Le Directeur', directorName: '', refPrefix: '',
  });
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(new Date()));
  const [modeFilter, setModeFilter] = useState('all');
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [shareHint, setShareHint]   = useState(false);

  useEffect(() => {
    db.settings.toArray().then(rows => {
      const s = {}; rows.forEach(r => { s[r.key] = r.value; });
      setSettings(prev => ({
        ...prev, ...s,
        showSaturday: s.showSaturday === true || s.showSaturday === 'true',
        showSunday: s.showSunday === true || s.showSunday === 'true',
      }));
    });
  }, []);

  const lang     = settings.language || 'fr';
  const instType = settings.institutionType || 'university';
  const numDays  = getWeekDayCount(instType, settings);
  const DAYS     = getWeekDayLabels(numDays, lang);
  const allSlots = buildAllSlots(instType);
  const displaySlots = allSlots.filter(s => !s.isBreak);

  // ── Lookups ──────────────────────────────────────────────────
  const courseMap   = Object.fromEntries(courses.map(c   => [c.id, c]));
  const lecturerMap = Object.fromEntries(lecturers.map(l => [l.id, l]));
  const roomMap     = Object.fromEntries(rooms.map(r     => [r.id, r]));

  const holidayMap = {};
  holidays.forEach(h => { holidayMap[h.date] = h; });

  const weekDates = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(weekMonday); d.setDate(d.getDate() + i); return d;
  });

  // ── Specialities list (from filtered groups) ─────────────────
  const specialities = React.useMemo(() => {
    const seen = new Set(); const list = [];
    groups.forEach(g => {
      if (modeFilter !== 'all' && g.mode !== modeFilter) return;
      const sp = g.speciality || g.code || g.name;
      if (!seen.has(sp)) { seen.add(sp); list.push(sp); }
    });
    return list;
  }, [groups, modeFilter]);

  const specColorMap = React.useMemo(() => {
    const m = {};
    specialities.forEach((s, i) => { m[s] = i; });
    return m;
  }, [specialities]);

  // ── Grid ─────────────────────────────────────────────────────
  const grid = React.useMemo(() => {
    const g = {};
    for (let di = 0; di < numDays; di++) {
      g[di] = {};
      allSlots.forEach((_, si) => { g[di][si] = {}; specialities.forEach(sp => { g[di][si][sp] = []; }); });
    }
    sessions.forEach(s => {
      if (modeFilter !== 'all' && s.mode !== modeFilter) return;
      if (s.day < 0 || s.day >= numDays || s.slot < 0 || s.slot >= allSlots.length) return;
      const firstGroup = groups.find(gg => s.groups?.includes(gg.id));
      const sp = firstGroup?.speciality || firstGroup?.code || firstGroup?.name || 'Autre';
      if (!g[s.day][s.slot][sp]) g[s.day][s.slot][sp] = [];
      g[s.day][s.slot][sp].push(s);
    });
    return g;
  }, [sessions, groups, specialities, numDays, allSlots, modeFilter]);

  const dateRange = formatWeekRange(weekMonday, numDays, lang);

  // ── PDF Export ───────────────────────────────────────────────
  const handlePDFExport = async () => {
    setExporting(true);
    setShowExport(false);
    try {
      await exportTimetablePDF({
        sessions, groups, courses, lecturers, rooms, holidays,
        settings, filterGroupId: null, weekMonday, numDays,
        allSlots,
        fullSlots: allSlots,
        lang,
        generatedBy: user?.fullName || null,
      });
      setShareHint(true);
      setTimeout(() => setShareHint(false), 10000);
    } finally {
      setExporting(false);
    }
  };

  // ── Excel Export ─────────────────────────────────────────────
  const exportExcel = () => {
    const rows = [
      [settings.institutionName || 'Grille Maîtresse'],
      [settings.semester, settings.cohort].filter(Boolean).join(' — '),
      [dateRange], [],
      ['Horaire / Slot', ...DAYS.flatMap(d => specialities.map(sp => `${d} — ${sp}`))],
    ];
    displaySlots.forEach(slot => {
      const si = allSlots.findIndex(s => s.label === slot.label);
      const row = [slot.label];
      for (let di = 0; di < numDays; di++) {
        const iso = toISO(weekDates[di]);
        specialities.forEach(sp => {
          if (holidayMap[iso]) { row.push(lang==='fr' ? holidayMap[iso].name_fr : holidayMap[iso].name_en); return; }
          const cellS = grid[di]?.[si]?.[sp] || [];
          row.push(cellS.map(s => {
            const c = courseMap[s.courseId]; const l = lecturerMap[s.lecId]; const r = roomMap[s.roomId];
            const prog = s.sessionNum ? ` (${s.sessionNum}/${s.totalSessions||'?'})` : '';
            return `${c?.code||'?'}${prog} | ${l?.name||'—'} | ${r?.name||'—'}`;
          }).join('\n') || '');
        });
      }
      rows.push(row);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, ...Array(numDays * specialities.length).fill({ wch: 24 })];
    XLSX.utils.book_append_sheet(wb, ws, 'Grille Maîtresse');
    XLSX.writeFile(wb, `grille-maitre-semaine${settings.currentWeek}-${toISO(weekMonday)}.xlsx`);
    setShowExport(false);
  };

  return (
    <div className="space-y-5">
      {shareHint && (
        <div className={panelSuccess}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>PDF téléchargé — ouvrez WhatsApp et envoyez-le à vos groupes étudiants.</span>
        </div>
      )}

      <div className={panelInfo}>
        <p className="font-medium">{t('mgLegendTitle')}</p>
        <p className="mt-1">{t('mgLegendBody')}</p>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Grille Maîtresse</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue combinée · {specialities.length} filière{specialities.length !== 1 ? 's' : ''} · {sessions.length} séances
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Mode filter */}
          <div className="flex rounded-xl border border-border overflow-hidden bg-card text-xs">
            {[['all','Tous'],['day','Jour'],['evening','Soir']].map(([v,l]) => (
              <button key={v} onClick={() => setModeFilter(v)}
                className={`px-3 py-2 font-medium transition-colors ${modeFilter===v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                {l}
              </button>
            ))}
          </div>

          {sessions.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowExport(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
                <Download className="w-4 h-4" />
                {exporting ? 'Export...' : 'Exporter'}
              </button>
              {showExport && (
                <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                  className="absolute right-0 top-11 z-50 bg-card border border-border rounded-xl shadow-xl p-1 min-w-47.5">
                  <button onClick={handlePDFExport} disabled={exporting}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left disabled:opacity-50">
                    <span className="text-red-500 text-base">📄</span> PDF (format IUGET)
                  </button>
                  <button onClick={exportExcel}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left">
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" /> Excel
                  </button>
                  <button onClick={() => { window.print(); setShowExport(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left">
                    <Printer className="w-4 h-4 text-blue-500" /> Imprimer
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Week navigator ── */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
        <button onClick={() => setWeekMonday(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n; })}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{dateRange}</p>
          {settings.currentWeek && (
            <p className="text-xs text-muted-foreground">
              Semaine {settings.currentWeek}/{settings.totalWeeks || '?'}
              {settings.semester ? ` · ${settings.semester}` : ''}
              {settings.cohort   ? ` · ${settings.cohort}`   : ''}
            </p>
          )}
        </div>
        <button onClick={() => setWeekMonday(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n; })}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Speciality legend ── */}
      {specialities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {specialities.map(sp => (
            <span key={sp} className={`text-xs font-semibold px-3 py-1 rounded-full border ${specColorMap[sp]}`}>{sp}</span>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
          <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Générez d'abord un emploi du temps dans l'onglet "Emploi du Temps".</p>
        </div>
      ) : specialities.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          Aucun groupe ne correspond au filtre sélectionné.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="text-[10px] border-collapse" style={{ minWidth: Math.max(700, 80 + numDays * specialities.length * 100) }}>
              <thead>
                {/* Row 1: Day headers (each spanning specialities.length columns) */}
                <tr className="bg-primary text-white">
                  <th rowSpan={2} className="px-3 py-2 text-left font-bold border-r border-primary-700 bg-primary-900 text-xs whitespace-nowrap align-middle"
                    style={{ minWidth: 80 }}>
                    {lang === 'fr' ? 'Filières →' : 'Specialities →'}<br />
                    <span className="font-normal opacity-70">{lang === 'fr' ? 'Jours ↓' : 'Days ↓'}</span>
                  </th>
                  {DAYS.map((d, di) => {
                    const iso   = toISO(weekDates[di]);
                    const isHol = !!holidayMap[iso];
                    const dateStr = weekDates[di].toLocaleDateString(lang==='fr'?'fr-FR':'en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
                    const isSat   = weekDates[di].getDay() === 6;
                    return (
                      <th key={di} colSpan={specialities.length}
                        className={`px-2 py-2 text-center font-bold border-r border-primary-700 ${isSat ? 'bg-indigo-700' : ''}`}
                        style={{ fontSize: 11 }}>
                        <div>{d}</div>
                        <div className="text-[9px] font-normal opacity-80">{dateStr}</div>
                        {isHol && <div className="text-[9px] text-yellow-300">🏖 {lang==='fr' ? holidayMap[iso].name_fr : holidayMap[iso].name_en}</div>}
                      </th>
                    );
                  })}
                </tr>
                {/* Row 2: Speciality sub-headers */}
                <tr className="bg-primary-900 text-white">
                  {DAYS.map((_, di) =>
                    specialities.map((sp, si) => {
                      const isSat = weekDates[di].getDay() === 6;
                      return (
                        <th key={`${di}-${si}`}
                          className={`px-1 py-1.5 text-center font-semibold border-r border-primary-700 last:border-r-0 ${isSat ? 'bg-indigo-800' : ''}`}
                          style={{ minWidth: 90, fontSize: 8 }}>
                          {sp.length > 16 ? sp.slice(0, 15) + '…' : sp}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {displaySlots.map((slot, rowIdx) => {
                  const si    = allSlots.findIndex(s => s.label === slot.label);
                  const isEve = slot.isEve;
                  return (
                    <tr key={rowIdx} className={`border-t border-border ${isEve ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : rowIdx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      {/* Slot label */}
                      <td className="px-3 py-2 font-mono font-bold text-muted-foreground border-r border-border whitespace-nowrap align-middle bg-muted/30"
                        style={{ fontSize: 10 }}>
                        {slot.label}
                        {isEve && <div className="text-[8px] text-indigo-400 font-sans font-normal">Cours du Soir</div>}
                      </td>

                      {/* Day × Speciality cells */}
                      {DAYS.map((_, di) => {
                        const iso   = toISO(weekDates[di]);
                        const isHol = !!holidayMap[iso];
                        const isSat = weekDates[di].getDay() === 6;

                        return specialities.map((sp, spIdx) => {
                          if (isHol) {
                            return (
                              <td key={`${di}-${spIdx}`}
                                className="px-1 py-1 text-center align-middle border-r border-border last:border-r-0 bg-orange-50/50 dark:bg-orange-950/20"
                                style={{ minHeight: 52 }}>
                                <CalendarX className="w-3 h-3 text-orange-300 mx-auto" />
                              </td>
                            );
                          }
                          const cellS = grid[di]?.[si]?.[sp] || [];
                          return (
                            <td key={`${di}-${spIdx}`}
                              className={`px-1 py-1 align-top border-r border-border last:border-r-0 ${isSat ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}
                              style={{ minWidth: 90, minHeight: 52 }}>
                              {cellS.map((s, idx) => {
                                const c  = courseMap[s.courseId];
                                const l  = lecturerMap[s.lecId];
                                const r  = roomMap[s.roomId];
                                const accentIdx = specColorMap[sp] ?? 0;
                                const name = lang === 'fr' ? (c?.name_fr || c?.name_en || c?.code) : (c?.name_en || c?.name_fr || c?.code);
                                const prog = s.sessionNum ? ` (${s.sessionNum}/${s.totalSessions || '?'})` : '';
                                const ca   = s.isCombined ? ' (CA)' : '';
                                return (
                                  <div key={idx} className={`${sessionCardClasses(accentIdx)} !px-1.5 !py-1 !mb-0.5 !text-[10px]`}>
                                    <p className="font-bold text-[10px] uppercase leading-tight text-slate-900">
                                      {name || c?.code || '?'}{prog}{ca}
                                    </p>
                                    <p className="text-[10px] text-slate-700">{l?.name || '—'}</p>
                                    {r && <p className="text-[9px] text-slate-500">{r.name}</p>}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        });
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
