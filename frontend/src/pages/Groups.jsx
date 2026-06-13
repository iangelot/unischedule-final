import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Users, Edit2, Trash2, X } from 'lucide-react';
import { db, performOfflineAction, CAMEROON_SPECIALITIES } from '../db';
import { badgeDay, badgeEvening } from '../lib/uiBadges';

const SPECIALITIES = Object.keys(CAMEROON_SPECIALITIES);
const EMPTY_FORM = { name: '', count: 30, mode: 'day', speciality: '', year: 1 };

export default function Groups() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const groups = useLiveQuery(
    () => db.groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).toArray(),
    [searchTerm]
  );

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (g) => {
    setEditItem(g);
    setForm({ name: g.name, count: g.count, mode: g.mode, speciality: g.speciality || '', year: g.year || 1 });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.speciality) return;
    setSaving(true);
    const meta = CAMEROON_SPECIALITIES[form.speciality];
    const data = editItem
      ? { ...editItem, ...form, code: meta?.code || editItem.code }
      : { id: 'g_' + Date.now(), ...form, code: meta?.code || '' };
    await performOfflineAction(editItem ? 'UPDATE' : 'ADD', 'groups', data);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = (id) => performOfflineAction('DELETE', 'groups', { id });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Groupes Étudiants</h2>
          <p className="text-sm text-muted-foreground mt-1">Gérez les classes, effectifs et filières.</p>
        </div>
        <button onClick={openAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Ajouter un groupe
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher un groupe..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Groupe</th>
                <th className="px-6 py-4 font-semibold">Filière</th>
                <th className="px-6 py-4 font-semibold">Effectif</th>
                <th className="px-6 py-4 font-semibold">Créneau</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!groups ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Chargement...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">Aucun groupe trouvé.</p>
                  </div>
                </td></tr>
              ) : groups.map(group => (
                <tr key={group.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {group.name.substring(0, 2)}
                      </div>
                      {group.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{group.speciality || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{group.count}</td>
                  <td className="px-6 py-4">
                    <span className={group.mode === 'day' ? badgeDay : badgeEvening}>
                      {group.mode === 'day' ? 'Jour' : 'Soir'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(group)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(group.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                <h3 className="text-lg font-bold text-foreground">{editItem ? 'Modifier le groupe' : 'Nouveau groupe'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nom du groupe *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder="ex: GL-3A ou RT-SOIR" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Filière *</label>
                  <select value={form.speciality} onChange={e => setForm(f => ({...f, speciality: e.target.value}))}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">— Choisir une filière —</option>
                    {SPECIALITIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Effectif</label>
                    <input type="number" min="1" max="500" value={form.count} onChange={e => setForm(f => ({...f, count: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Niveau</label>
                    <input type="number" min="1" max="5" value={form.year} onChange={e => setForm(f => ({...f, year: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Créneau</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'day', l: 'Jour' }, { v: 'evening', l: 'Soir' }].map(({ v, l }) => (
                      <button key={v} type="button" onClick={() => setForm(f => ({...f, mode: v}))}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.mode === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50">Annuler</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.speciality}
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
