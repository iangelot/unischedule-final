import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, RefreshCw, BookOpen, MapPin, Calendar } from 'lucide-react';
import { db, TIME_SLOTS } from '../db';
import { getCourseName } from '../lib/courseUtils';
import { formatSessionLabel } from '../lib/sessionNumbers';
import { getWeekDayLabels } from '../lib/weekConfig';
import { useLang } from '../hooks/useLang';

const DAY_SLOTS_UNI = [...TIME_SLOTS.university, ...TIME_SLOTS.evening].filter(s => !s.isBreak);

function detectLocalConflicts(sessions) {
  const conflicts = [];
  const slotMap = {};
  sessions.forEach(s => {
    const key = `${s.day}-${s.slot}`;
    if (!slotMap[key]) slotMap[key] = [];
    slotMap[key].push(s);
  });

  Object.entries(slotMap).forEach(([key, sArr]) => {
    const lecMap = {};
    sArr.forEach(s => {
      if (s.lecId) {
        if (!lecMap[s.lecId]) lecMap[s.lecId] = [];
        lecMap[s.lecId].push(s);
      }
    });
    Object.entries(lecMap).forEach(([lecId, arr]) => {
      if (arr.length > 1) {
        conflicts.push({
          id: `lec-${lecId}-${key}`,
          type: 'LECTURER_DOUBLE_BOOKED',
          severity: 'hard',
          sessions: arr,
          day: +key.split('-')[0],
          slot: +key.split('-')[1],
        });
      }
    });

    const roomMap = {};
    sArr.forEach(s => {
      if (s.roomId) {
        if (!roomMap[s.roomId]) roomMap[s.roomId] = [];
        roomMap[s.roomId].push(s);
      }
    });
    Object.entries(roomMap).forEach(([roomId, arr]) => {
      if (arr.length > 1) {
        conflicts.push({
          id: `room-${roomId}-${key}`,
          type: 'ROOM_DOUBLE_BOOKED',
          severity: 'hard',
          sessions: arr,
          day: +key.split('-')[0],
          slot: +key.split('-')[1],
        });
      }
    });
  });

  return conflicts;
}

export default function Conflicts() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts]   = useState(null);

  const sessions  = useLiveQuery(() => db.sessions.toArray());
  const courses   = useLiveQuery(() => db.courses.toArray()) || [];
  const lecturers = useLiveQuery(() => db.lecturers.toArray()) || [];
  const rooms     = useLiveQuery(() => db.rooms.toArray()) || [];

  const courseMap   = useMemo(() => Object.fromEntries(courses.map(c => [c.id, c])), [courses]);
  const lecturerMap = useMemo(() => Object.fromEntries(lecturers.map(l => [l.id, l])), [lecturers]);
  const roomMap     = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms]);
  const days        = getWeekDayLabels(7, lang);

  useEffect(() => {
    if (sessions) {
      setConflicts(detectLocalConflicts(sessions));
    }
  }, [sessions]);

  const runCheck = async () => {
    setIsChecking(true);
    await new Promise(r => setTimeout(r, 400));
    setConflicts(detectLocalConflicts(sessions || []));
    setIsChecking(false);
  };

  const describeSession = (s) => {
    const course = courseMap[s.courseId];
    const lec = lecturerMap[s.lecId];
    const room = roomMap[s.roomId];
    const day = days[s.day] || `J${s.day}`;
    const slotLabel = DAY_SLOTS_UNI[s.slot]?.label || `créneau ${s.slot + 1}`;
    const sess = formatSessionLabel(s, lang);
    const name = getCourseName(course, lang);
    return `${course?.code || name} ${sess ? `· ${sess}` : ''} · ${lec?.name || '—'} · ${room?.name || '—'} · ${day} ${slotLabel}`;
  };

  const conflictDescription = (c) => {
    const day = days[c.day] || `jour ${c.day}`;
    const slotLabel = DAY_SLOTS_UNI[c.slot]?.label || `créneau ${c.slot + 1}`;
    const type = c.type === 'LECTURER_DOUBLE_BOOKED'
      ? (lang === 'fr' ? 'Enseignant en double' : 'Lecturer double-booked')
      : (lang === 'fr' ? 'Salle en double' : 'Room double-booked');
    return `${type} — ${day}, ${slotLabel}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            {lang === 'fr' ? 'Conflits & séances' : 'Conflicts & sessions'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'fr'
              ? 'Vérifiez les chevauchements et le numéro de séance de chaque cours.'
              : 'Check overlaps and each course session number.'}
          </p>
        </div>
        <button onClick={runCheck} disabled={isChecking}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {lang === 'fr' ? 'Revérifier' : 'Re-check'}
        </button>
      </div>

      {sessions && sessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              {lang === 'fr' ? 'Séances planifiées' : 'Scheduled sessions'} ({sessions.length})
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {sessions.map(s => (
              <div key={s.id} className="px-6 py-2.5 text-sm text-foreground hover:bg-muted/30">
                {describeSession(s)}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {conflicts === null ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-slate-800" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {lang === 'fr' ? 'Aucun conflit' : 'No conflicts'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {lang === 'fr'
                ? 'L\'emploi du temps est cohérent. Vous pouvez exporter le PDF.'
                : 'The timetable is consistent. You can export the PDF.'}
            </p>
          </div>
        ) : (
          <div>
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {conflicts.length} {lang === 'fr' ? 'conflit(s)' : 'conflict(s)'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'fr' ? 'Corrigez dans l\'emploi du temps (glisser-déposer).' : 'Fix in the timetable (drag and drop).'}
              </p>
            </div>
            <div className="divide-y divide-border">
              {conflicts.map((c, i) => {
                const Icon = c.type === 'LECTURER_DOUBLE_BOOKED' ? BookOpen : MapPin;
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-destructive/10 text-destructive">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">CONFLIT</span>
                        <p className="text-sm text-foreground font-medium mt-1">{conflictDescription(c)}</p>
                        <ul className="mt-2 space-y-1">
                          {(c.sessions || []).map(s => (
                            <li key={s.id} className="text-xs text-muted-foreground pl-2 border-l-2 border-destructive/30">
                              {describeSession(s)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-border">
              <button onClick={() => navigate('/timetable')}
                className="text-sm text-primary font-semibold hover:underline">
                {lang === 'fr' ? 'Aller à l\'emploi du temps pour corriger →' : 'Go to timetable to fix →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
