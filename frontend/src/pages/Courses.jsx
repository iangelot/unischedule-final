import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, BookOpen, Edit2, Trash2, X, Share2 } from 'lucide-react';
import { db, performOfflineAction, CAMEROON_SPECIALITIES } from '../db';
import { specialityLabel } from '../lib/cameroonSpecialities';
import { normalizeCourse, prepareCourseForSave, courseToForm, getCourseName, hoursToSessions, sessionHoursForCourse } from '../lib/courseUtils';
import { useLang } from '../hooks/useLang';

const SPECIALITIES = Object.keys(CAMEROON_SPECIALITIES);
const EMPTY_FORM = { code: '', name_en: '', name_fr: '', credits: 3, hoursPerWeek: 3, totalHours: '', block: false, roomType: '', shareable: false, speciality: '' };
const ROOM_TYPE_OPTS = [
  { id: '', key: 'crsAnyRoom' },
  { id: 'classroom', key: 'rmClassroom' },
  { id: 'lab', key: 'rmLab' },
  { id: 'amphitheater', key: 'rmAmphi' },
  { id: 'seminar', key: 'rmSeminar' },
];

export default function Courses() {
  const { t, lang } = useLang();
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
          <h2 className="text-2xl font-bold text-foreground">{t('crsTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('crsSubtitle')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> {t('crsAddBtn')}
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t('crsSearchPh')} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('crsCode')}</th>
                <th className="px-6 py-4 font-semibold">{t('crsName')}</th>
                <th className="px-6 py-4 font-semibold">{t('cSpeciality')}</th>
                <th className="px-6 py-4 font-semibold">{t('crsCredits')}</th>
                <th className="px-6 py-4 font-semibold">{t('crsHoursCol')}</th>
                <th className="px-6 py-4 font-semibold">{t('crsSessionsCol')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('cActions')}</th>
              </tr>
            </thead>
            <tbody>
              {!courses ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">{t('cLoading')}</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{t('crsNone')}</p>
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
                      <div>{getCourseName(n, lang)}</div>
                      {(lang === 'fr' ? n.name_en : n.name_fr) && <div className="text-xs text-muted-foreground">{lang === 'fr' ? n.name_en : n.name_fr}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {n.shareable
                        ? <span className="inline-flex items-center gap-1 text-teal-600"><Share2 className="w-3 h-3"/>{t('crsCommon')}</span>
                        : (n.speciality ? specialityLabel(n.speciality, lang) : '—')}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{n.credits}</td>
                    <td className="px-6 py-4 text-muted-foreground">{n.hoursPerWeek}{t('crsHoursUnit')}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {n.totalHours
                        ? `${n.totalHours} h · ${n.totalSessions} ${t('crsPerSem')}`
                        : (n.totalSessions ? `${n.totalSessions} ${t('crsPerSem')}` : t('crsAuto'))}
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
                <h3 className="text-lg font-bold text-foreground">{editItem ? t('crsEdit') : t('crsNew')}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsCode')} *</label>
                    <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))}
                      placeholder="INF301" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsCredits')}</label>
                    <input type="number" min="1" max="10" value={form.credits} onChange={e => setForm(f => ({...f, credits: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsNameFr')} *</label>
                  <input value={form.name_fr} onChange={e => setForm(f => ({...f, name_fr: e.target.value}))}
                    placeholder={t('crsNameFrPh')} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsNameEn')}</label>
                  <input value={form.name_en} onChange={e => setForm(f => ({...f, name_en: e.target.value}))}
                    placeholder={t('crsNameEnPh')} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsHoursWeek')}</label>
                    <input type="number" min="1" max="20" value={form.hoursPerWeek} onChange={e => setForm(f => ({...f, hoursPerWeek: +e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <p className="text-[10px] text-muted-foreground mt-1">{t('crsHoursHint')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsTotalHours')}</label>
                    <input type="number" min="1" max="400" value={form.totalHours} onChange={e => setForm(f => ({...f, totalHours: e.target.value}))}
                      placeholder={t('crsTotalHoursPh')} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {form.totalHours
                      ? <p className="text-[10px] text-emerald-600 mt-1">{t('crsHoursToSessions', hoursToSessions(form.totalHours, form), sessionHoursForCourse(form))}</p>
                      : <p className="text-[10px] text-muted-foreground mt-1">{t('crsTotalHoursHint')}</p>}
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f => ({...f, shareable: !f.shareable, speciality: f.shareable ? f.speciality : ''}))}
                    className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${form.shareable ? 'bg-primary-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${form.shareable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('cCommonAllSpec')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f => ({...f, block: !f.block}))}
                    className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${form.block ? 'bg-primary-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${form.block ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('crsBlock')}</span>
                </label>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('crsRoomType')}</label>
                  <select value={form.roomType} onChange={e => setForm(f => ({...f, roomType: e.target.value}))}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {ROOM_TYPE_OPTS.map(o => <option key={o.id} value={o.id}>{t(o.key)}</option>)}
                  </select>
                </div>
                {!form.shareable && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('cSpeciality')}</label>
                    <select value={form.speciality} onChange={e => setForm(f => ({...f, speciality: e.target.value}))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">{t('crsChoose')}</option>
                      {SPECIALITIES.map(s => <option key={s} value={s}>{specialityLabel(s, lang)}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50">{t('cCancel')}</button>
                <button onClick={handleSave} disabled={saving || !form.code || !form.name_fr}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
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
