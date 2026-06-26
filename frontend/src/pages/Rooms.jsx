import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, MapPin, Edit2, Trash2, X } from 'lucide-react';
import { db, performOfflineAction } from '../db';
import { useLang } from '../hooks/useLang';

const EMPTY_FORM = { name: '', cap: 50, eve: true, type: 'classroom' };
const ROOM_TYPES = [
  { id: 'classroom',    key: 'rmClassroom' },
  { id: 'amphitheater', key: 'rmAmphi' },
  { id: 'lab',          key: 'rmLab' },
  { id: 'seminar',      key: 'rmSeminar' },
];
const TYPE_COLORS = {
  amphitheater: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  classroom:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lab:          'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  seminar:      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

export default function Rooms() {
  const { t } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const rooms = useLiveQuery(
    () => db.rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).toArray(),
    [searchTerm]
  );

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (r) => { setEditItem(r); setForm({ name: r.name, cap: r.cap, eve: r.eve, type: r.type }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = editItem ? { ...editItem, ...form } : { id: 'r_' + Date.now(), ...form };
    await performOfflineAction(editItem ? 'UPDATE' : 'ADD', 'rooms', data);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = (id) => performOfflineAction('DELETE', 'rooms', { id });
  const typeLabel = (type) => { const r = ROOM_TYPES.find(r => r.id === type); return r ? t(r.key) : type; };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('rmTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('rmSubtitle')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> {t('rmAddBtn')}
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t('rmSearchPh')} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('rmTitle')}</th>
                <th className="px-6 py-4 font-semibold">{t('cType')}</th>
                <th className="px-6 py-4 font-semibold">{t('cCapacity')}</th>
                <th className="px-6 py-4 font-semibold">{t('cAvailability')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cActions')}</th>
              </tr>
            </thead>
            <tbody>
              {!rooms ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">{t('cLoading')}</td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground/50 mb-3 mx-auto" />
                  <p className="text-muted-foreground font-medium">{t('rmNone')}</p>
                </td></tr>
              ) : rooms.map(room => (
                <tr key={room.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{room.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[room.type] || 'bg-muted text-muted-foreground'}`}>
                      {typeLabel(room.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="font-semibold">{room.cap}</span> <span className="text-xs text-muted-foreground">{t('rmSeats')}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{t('cDay')}</span>
                      {room.eve && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">{t('cEvening')}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(room)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(room.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{editItem ? t('rmEdit') : t('rmNew')}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('cName')} *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder={t('rmNamePh')} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('cType')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOM_TYPES.map(rt => (
                      <button key={rt.id} type="button" onClick={() => setForm(f => ({...f, type: rt.id}))}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${form.type === rt.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                        {t(rt.key)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    {t('cCapacity')} — <span className="text-primary font-bold">{form.cap} {t('rmSeats')}</span>
                  </label>
                  <input type="range" min="10" max="600" step="5" value={form.cap}
                    onChange={e => setForm(f => ({...f, cap: +e.target.value}))}
                    className="w-full accent-primary" />
                </div>
                <button type="button" onClick={() => setForm(f => ({...f, eve: !f.eve}))}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.eve ? 'bg-purple-100 text-purple-700 border-purple-300' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                  {form.eve ? t('rmEveAvail') : t('rmDayOnly')}
                </button>
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
