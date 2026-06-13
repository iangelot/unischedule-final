import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, BookOpen, Edit2, Trash2, X, Share2 } from 'lucide-react';
import { db, performOfflineAction, CAMEROON_SPECIALITIES } from '../db';
import { normalizeCourse, prepareCourseForSave, courseToForm, getCourseName } from '../lib/courseUtils';

const SPECIALITIES = Object.keys(CAMEROON_SPECIALITIES);
const EMPTY_FORM = { code: '', name_en: '', name_fr: '', credits: 3, hoursPerWeek: 3, totalSessions: '', shareable: false, speciality: '' };

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const courses = useLiveQuery(
    () => db.courses.toArray().then(list =>
      list.filter(c => {
        const n = normalizeCourse(c);
        const q = searchTerm.toLowerCase();
        return c.code.toLowerCase().includes(q) ||
          n.name_en.toLowerCase().includes(q) ||
          n.name_fr.toLowerCase().includes(q);
      })
    ),
    [searchTerm]
  );

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm(courseToForm(c)); setShowModal(true); };

  const handleSave = async () => {
    if (!form.code || !form.name_fr) return;
    setSaving(true);
    const data = prepareCourseForSave(form, editItem);
    await performOfflineAction(editItem ? 'UPDATE' : 'ADD', 'courses', data);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = (id) => performOfflineAction('DELETE', 'courses', { id });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Catalogue des Cours</h2>
          <p className="text-sm text-muted-foreground mt-1">Définissez les modules, crédits et filières.</p>
        </div>
        <button onClick={openAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Ajouter un cours
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher par code ou nom..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Intitulé</th>
                <th className="px-6 py-4 font-semibold">Filière</th>
                <th className="px-6 py-4 font-semibold">Crédits</th>
                <th className="px-6 py-4 font-semibold">H/sem</th>
                <th className="px-6 py-4 font-semibold">Séances</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!courses ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucun cours trouvé.</p>
                  </div>
                </td></tr>
              ) : courses.map(course => {
                const n = normalizeCourse(course);
                return (
                  <tr key={course.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-mono font-bold px-2 py-1 rounded">{n.code}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div>{getCourseName(n, 'fr')}</div>
                      {n.name_en && <div className="text-xs text-muted-foreground">{n.name_en}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {n.shareable
                        ? <span className="inline-flex items-center gap-1 text-teal-600"><Share2 className="w-3 h-3"/>Commun</span>
                        : (n.speciality || '—')}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{n.credits}</td>
                    <td className="px-6 py-4 text-muted-foreground">{n.hoursPerWeek}h</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {n.totalSessions ? `${n.totalSessions} / sem.` : '— auto'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(course)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(course.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                <h3 className="text-lg font-bold text-foreground">{editItem ? 'Modifier le cours' : 'Nouveau cours'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Code *</label>
                    <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))}
                      placeholder="INF301" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Crédits</label>
                    <input type="number" min="1" max="10" value={form.credits} onChange={e => setForm(f => ({...f, credits: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Intitulé (Français) *</label>
                  <input value={form.name_fr} onChange={e => setForm(f => ({...f, name_fr: e.target.value}))}
                    placeholder="Algorithmique et Structures de Données" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Intitulé (Anglais)</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({...f, name_en: e.target.value}))}
                    placeholder="Algorithms & Data Structures" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Heures / semaine</label>
                    <input type="number" min="1" max="20" value={form.hoursPerWeek} onChange={e => setForm(f => ({...f, hoursPerWeek: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <p className="text-[10px] text-muted-foreground mt-1">2h par créneau → séances/semaine calculées auto</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Séances au semestre</label>
                    <input type="number" min="1" max="200" value={form.totalSessions} onChange={e => setForm(f => ({...f, totalSessions: e.target.value}))}
                      placeholder="ex. 30" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <p className="text-[10px] text-muted-foreground mt-1">Vide = heures/sem × nb semaines</p>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f => ({...f, shareable: !f.shareable, speciality: f.shareable ? f.speciality : ''}))}
                    className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${form.shareable ? 'bg-primary-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${form.shareable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">Cours commun (toutes filières)</span>
                </label>
                {!form.shareable && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Filière</label>
                    <select value={form.speciality} onChange={e => setForm(f => ({...f, speciality: e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">— Choisir —</option>
                      {SPECIALITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50">Annuler</button>
                <button onClick={handleSave} disabled={saving || !form.code || !form.name_fr}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
