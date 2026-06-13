import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarX, Plus, Trash2, RefreshCw, Calendar, Globe, Flag, Info } from 'lucide-react';
import { db, CAMEROON_HOLIDAYS } from '../db';

const HOLIDAY_TYPES = [
  { value: 'national', label: 'Fête Nationale',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'religious', label: 'Fête Religieuse', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'academic',  label: 'Académique',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'other',     label: 'Autre',             color: 'bg-muted text-muted-foreground' },
];

function typeColor(type) {
  return (HOLIDAY_TYPES.find(t => t.value === type) || HOLIDAY_TYPES[3]).color;
}

export default function Holidays() {
  const holidays = useLiveQuery(() => db.holidays.orderBy('date').toArray()) || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ date: '', name_fr: '', name_en: '', type: 'national' });
  const [error, setError]       = useState('');

  const handleAdd = async () => {
    if (!form.date || !form.name_fr) { setError('La date et le nom (FR) sont obligatoires.'); return; }
    setError('');
    const existing = await db.holidays.get(form.date);
    if (existing) { setError('Un congé existe déjà à cette date.'); return; }

    await db.holidays.add({
      id:       form.date,
      date:     form.date,
      name_fr:  form.name_fr,
      name_en:  form.name_en || form.name_fr,
      type:     form.type,
      full_day: true,
    });
    setForm({ date: '', name_fr: '', name_en: '', type: 'national' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await db.holidays.delete(id);
  };

  const handleReseedCameroon = async () => {
    const year = new Date().getFullYear();
    const fixed = CAMEROON_HOLIDAYS.filter(h => !h.variable);
    for (const h of fixed) {
      const date = `${year}-${String(h.month).padStart(2,'0')}-${String(h.day).padStart(2,'0')}`;
      const exists = await db.holidays.get(date);
      if (!exists) {
        await db.holidays.add({ id: date, date, name_fr: h.name_fr, name_en: h.name_en, type: h.type, full_day: true });
      }
    }
  };

  // Group by month
  const byMonth = {};
  holidays.forEach(h => {
    const month = h.date?.substring(0, 7) || 'unknown';
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(h);
  });

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatMonthHeader = (ym) => {
    const [y, m] = ym.split('-');
    const d = new Date(+y, +m - 1, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Jours Fériés & Congés</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ces dates apparaissent dans l'emploi du temps avec une bannière colorée.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReseedCameroon}
            className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Fêtes Cameroun
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Ajouter un congé
          </button>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Les jours fériés bloquent automatiquement les créneaux dans l'emploi du temps et apparaissent dans les exports PDF/Excel.</p>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4 overflow-hidden"
          >
            <h3 className="font-semibold text-foreground">Nouveau Jour Férié</h3>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {HOLIDAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nom (Français) *</label>
                <input type="text" value={form.name_fr} onChange={e => setForm(f => ({ ...f, name_fr: e.target.value }))}
                  placeholder="ex: Fête Nationale"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nom (Anglais)</label>
                <input type="text" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                  placeholder="ex: National Day"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                Ajouter
              </button>
              <button onClick={() => { setShowForm(false); setError(''); }}
                className="px-5 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holiday list */}
      {holidays.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <CalendarX className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun jour férié</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Cliquez sur "Fêtes Cameroun" pour charger les jours fériés officiels du Cameroun, ou ajoutez-en un manuellement.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).sort().map(([month, hols]) => (
            <div key={month}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {formatMonthHeader(month)} — {hols.length} jour{hols.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {hols.map(h => (
                  <motion.div key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4 group hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                      <CalendarX className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{h.name_fr}</p>
                      {h.name_en && h.name_en !== h.name_fr && (
                        <p className="text-xs text-muted-foreground">{h.name_en}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{formatDate(h.date)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor(h.type)}`}>
                      {HOLIDAY_TYPES.find(t => t.value === h.type)?.label || h.type}
                    </span>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
