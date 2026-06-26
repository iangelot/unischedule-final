import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, UserCheck, Edit2, Trash2, X } from 'lucide-react';
import { db, performOfflineAction, CAMEROON_SPECIALITIES } from '../db';
import { specialityLabel } from '../lib/cameroonSpecialities';
import { useLang } from '../hooks/useLang';

const SPECIALITIES = Object.keys(CAMEROON_SPECIALITIES);
const CONTRACT_TYPES = [
  { id: 'permanent', key: 'lecPermanent' },
  { id: 'vacataire', key: 'lecVacataire' },
  { id: 'visiting',  key: 'lecVisiting' },
  { id: 'part_time', key: 'lecPartTime' },
];
const EMPTY_FORM = { name: '', type: 'permanent', day: true, eve: false, maxHours: 10, speciality: '' };

export default function Lecturers() {
  const { t, lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const lecturers = useLiveQuery(
    () => db.lecturers.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).toArray(),
    [searchTerm]
  );

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (l) => {
    setEditItem(l);
    setForm({ name: l.name, type: l.type, day: l.day, eve: l.eve, maxHours: l.maxHours, speciality: l.speciality || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = editItem ? { ...editItem, ...form } : { id: 'l_' + Date.now(), ...form };
    await performOfflineAction(editItem ? 'UPDATE' : 'ADD', 'lecturers', data);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = (id) => performOfflineAction('DELETE', 'lecturers', { id });
  const typeLabel = (type) => { const c = CONTRACT_TYPES.find(c => c.id === type); return c ? t(c.key) : type; };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('lecTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('lecSubtitle')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> {t('lecAddBtn')}
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t('lecSearchPh')} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('cName')}</th>
                <th className="px-6 py-4 font-semibold">{t('lecStatus')}</th>
                <th className="px-6 py-4 font-semibold">{t('cSpeciality')}</th>
                <th className="px-6 py-4 font-semibold">{t('cAvailability')}</th>
                <th className="px-6 py-4 font-semibold">{t('lecMaxLoad')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cActions')}</th>
              </tr>
            </thead>
            <tbody>
              {!lecturers ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">{t('cLoading')}</td></tr>
              ) : lecturers.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center">
                  <UserCheck className="w-12 h-12 text-muted-foreground/50 mb-3 mx-auto" />
                  <p className="text-muted-foreground font-medium">{t('lecNone')}</p>
                </td></tr>
              ) : lecturers.map(lecturer => (
                <tr key={lecturer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent-600 flex items-center justify-center font-bold text-xs">
                        {lecturer.name.charAt(0)}
                      </div>
                      {lecturer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{typeLabel(lecturer.type)}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{lecturer.speciality ? specialityLabel(lecturer.speciality, lang) : t('lecAllSpec')}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {lecturer.day && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">{t('cDay')}</span>}
                      {lecturer.eve && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full font-medium">{t('cEvening')}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{lecturer.maxHours}{t('lecHoursWeek')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(lecturer)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(lecturer.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{editItem ? t('lecEdit') : t('lecNew')}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('lecFullName')} *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder={t('lecNamePh')} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('lecMainSpec')}</label>
                  <select value={form.speciality} onChange={e => setForm(f => ({...f, speciality: e.target.value}))}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">{t('lecAllSpec')}</option>
                    {SPECIALITIES.map(s => <option key={s} value={s}>{specialityLabel(s, lang)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('lecStatus')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTRACT_TYPES.map(ct => (
                      <button key={ct.id} type="button" onClick={() => setForm(f => ({...f, type: ct.id}))}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${form.type === ct.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                        {t(ct.key)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('cAvailability')}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm(f => ({...f, day: !f.day}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.day ? 'bg-blue-100 text-blue-700 border-blue-300' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                      {t('cDay')}
                    </button>
                    <button type="button" onClick={() => setForm(f => ({...f, eve: !f.eve}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.eve ? 'bg-purple-100 text-purple-700 border-purple-300' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                      {t('cEvening')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    {t('lecMaxLoad')} — <span className="text-primary font-bold">{form.maxHours}{t('lecHoursWeek')}</span>
                  </label>
                  <input type="range" min="2" max="30" value={form.maxHours}
                    onChange={e => setForm(f => ({...f, maxHours: +e.target.value}))}
                    className="w-full accent-primary" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50">{t('cCancel')}</button>
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? t('cSaving') : editItem ? t('cSave') : t('cAdd')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
