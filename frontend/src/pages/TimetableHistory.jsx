import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import {
  History, Eye, RotateCcw, Trash2, Calendar, Clock, Users, AlertCircle, Download
} from 'lucide-react';
import { db } from '../db';
import { useLang } from '../hooks/useLang';
import { useAppStore } from '../store/useAppStore';
import {
  deleteTimetableSnapshot, restoreTimetableSnapshot, listTimetableSnapshots,
} from '../lib/timetableSnapshots';
import { exportTimetablePDF } from '../lib/exportPDF';
import { getWeekDayCount } from '../lib/weekConfig';
import { TIME_SLOTS } from '../db';

export default function TimetableHistory() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const user = useAppStore(s => s.user);
  const [busy, setBusy] = useState(null);

  const snapshots = useLiveQuery(() => listTimetableSnapshots()) ?? [];
  const settingsRows = useLiveQuery(() => db.settings.toArray()) || [];
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const lecturers = useLiveQuery(() => db.lecturers.toArray()) || [];
  const rooms = useLiveQuery(() => db.rooms.toArray()) || [];
  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const holidays = useLiveQuery(() => db.holidays.toArray()) || [];

  const settings = React.useMemo(() => {
    const s = {};
    settingsRows.forEach(r => { s[r.key] = r.value; });
    return s;
  }, [settingsRows]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleRestore = async (id) => {
    if (!window.confirm(t('thConfirmRestore'))) return;
    setBusy(id);
    try {
      await restoreTimetableSnapshot(id);
      navigate('/timetable');
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('thConfirmDelete'))) return;
    setBusy(id);
    try {
      await deleteTimetableSnapshot(id);
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async (snap) => {
    setBusy(snap.id);
    try {
      const instType = settings.institutionType || 'university';
      const numDays = getWeekDayCount(instType, settings);
      const dayPart = instType === 'secondary' ? TIME_SLOTS.secondary : TIME_SLOTS.university;
      const evePart = instType === 'secondary' ? [] : TIME_SLOTS.evening;
      const fullSlots = [...dayPart, ...evePart];
      const weekMonday = snap.weekMonday ? new Date(snap.weekMonday) : new Date();

      await exportTimetablePDF({
        sessions: snap.sessions,
        groups, courses, lecturers, rooms, holidays,
        settings,
        weekMonday,
        numDays,
        allSlots: fullSlots,
        fullSlots,
        lang,
        generatedBy: snap.generatedBy || user?.fullName,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="w-7 h-7 text-primary" />
          {t('thTitle')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('thSubtitle')}</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center px-6">
          <History className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">{t('thEmpty')}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t('thEmptyHint')}</p>
          <button onClick={() => navigate('/timetable')}
            className="mt-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90">
            {t('navTimetable')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snap, i) => (
            <motion.div
              key={snap.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-lg">
                    {snap.weekNumber
                      ? (lang === 'fr' ? `Semaine ${snap.weekNumber}` : `Week ${snap.weekNumber}`)
                      : snap.label}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {t('thGenerated')}: {formatDate(snap.savedAt)}
                    </span>
                    {snap.weekRange && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {snap.weekRange}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {snap.sessionCount} {t('thSessions')}
                    </span>
                  </div>
                  {snap.generatedBy && (
                    <p className="text-xs text-muted-foreground mt-1">{t('thBy')} {snap.generatedBy}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/timetable?view=${snap.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
                  >
                    <Eye className="w-4 h-4" /> {t('thView')}
                  </button>
                  <button
                    onClick={() => handleExport(snap)}
                    disabled={busy === snap.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => handleRestore(snap.id)}
                    disabled={busy === snap.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" /> {t('thRestore')}
                  </button>
                  <button
                    onClick={() => handleDelete(snap.id)}
                    disabled={busy === snap.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>{t('thNote')}</p>
      </div>
    </div>
  );
}
