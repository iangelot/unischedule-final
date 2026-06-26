import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Upload, Trash2, Building2, GraduationCap, School,
  Calendar, CheckCircle2, Info, User, FileText, Shield,
  Download, Users, Lock
} from 'lucide-react';
import { db, setSetting, CAMEROON_SPECIALITIES } from '../db';
import { specialityLabel } from '../lib/cameroonSpecialities';
import { useAppStore } from '../store/useAppStore';
import { useLang } from '../hooks/useLang';
import { canEditSetting, listUsers, createUser, deleteUser, ROLES } from '../lib/auth';
import { exportBackup, importBackup } from '../lib/backup';

const INSTITUTION_TYPES = [
  { value: 'university', labelKey: 'setTypeUni', icon: GraduationCap, descKey: 'setTypeUniDesc' },
  { value: 'secondary',  labelKey: 'setTypeSec', icon: School,        descKey: 'setTypeSecDesc' },
];

const EMPTY = {
  institutionName: '', schoolName: '', institutionType: 'university', slug: '',
  logo: null, logo2: null, showSaturday: true, showSunday: true, language: 'fr',
  currentWeek: '1', totalWeeks: '35', semester: '', cohort: '',
  city: 'Douala', directorTitle: 'Le Directeur', directorName: '', refPrefix: '',
};

export default function Settings() {
  const { t, lang } = useLang();
  const user = useAppStore(s => s.user);
  const isAdmin = user?.role === ROLES.ADMIN;
  const role = user?.role;

  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: ROLES.TIMETABLER });
  const [userMsg, setUserMsg] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const logoRef  = useRef(null);
  const logo2Ref = useRef(null);
  const backupRef = useRef(null);

  const canEdit = (key) => canEditSetting(key, role);

  useEffect(() => {
    db.settings.toArray().then(rows => {
      const s = {};
      rows.forEach(r => { s[r.key] = r.value; });
      setForm(prev => ({
        ...prev,
        ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, s[k] !== undefined ? s[k] : prev[k]])),
        showSaturday: s.showSaturday === true || s.showSaturday === 'true',
        showSunday: s.showSunday === true || s.showSunday === 'true',
      }));
    });
    if (isAdmin) listUsers().then(setUsers);
  }, [isAdmin]);

  const handleLogoUpload = (field) => (e) => {
    if (!canEdit(field)) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert(t('setLogoTooBig')); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set(field, ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    for (const [key, value] of Object.entries(form)) {
      if (canEdit(key)) await setSetting(key, value);
    }
    if (canEdit('institutionName')) {
      const slug = form.institutionName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || 'etablissement';
      await setSetting('slug', slug);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddUser = async () => {
    setUserMsg('');
    try {
      await createUser(newUser);
      setUsers(await listUsers());
      setNewUser({ fullName: '', email: '', password: '', role: ROLES.TIMETABLER });
      setUserMsg(t('setUserCreated'));
    } catch (e) {
      setUserMsg(e.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(t('setConfirmDeleteUser'))) return;
    try {
      await deleteUser(id);
      setUsers(await listUsers());
    } catch (e) {
      setUserMsg(e.message);
    }
  };

  const handleExportBackup = async () => {
    await exportBackup();
    setBackupMsg(t('setBackupExported'));
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(t('setConfirmImport'))) return;
    try {
      await importBackup(file);
      setBackupMsg(t('setRestored'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setBackupMsg(err.message || t('setImportErr'));
    }
    e.target.value = '';
  };

  const set = (key, val) => {
    if (!canEdit(key)) return;
    setForm(f => ({ ...f, [key]: val }));
  };

  const weekNum  = form.currentWeek || '1';
  const refMonth = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: '2-digit', year: '2-digit' }).replace('/', '-');
  const refPreview = form.refPrefix
    ? `REF: N°${weekNum}/${form.refPrefix}/${refMonth}-sw`
    : `REF: N°${weekNum}/[PREFIX]/${refMonth}-sw`;

  const lockedBanner = !isAdmin && (
    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
      <p>{t('setLockedBanner')}</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('setTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('setSubtitle')}
        </p>
      </div>

      {lockedBanner}

      {/* ── Identity (admin only) ── */}
      <Section title={t('setIdentity')} icon={Building2} locked={!isAdmin} t={t}>
        <div className="flex items-start gap-6">
          <LogoBox label={t('setLogoMain')} value={form.logo} disabled={!canEdit('logo')}
            onClear={() => set('logo', null)} onUpload={() => logoRef.current?.click()} />
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logo')} />
          <LogoBox label={t('setLogoSecond')} value={form.logo2} disabled={!canEdit('logo2')}
            onClear={() => set('logo2', null)} onUpload={() => logo2Ref.current?.click()} />
          <input ref={logo2Ref} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logo2')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${t('setInstName')} *`} placeholder={t('setInstNamePh')} value={form.institutionName}
            onChange={v => set('institutionName', v)} disabled={!canEdit('institutionName')} />
          <Field label={t('setSchoolName')} placeholder={t('setSchoolNamePh')} value={form.schoolName}
            onChange={v => set('schoolName', v)} disabled={!canEdit('schoolName')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">{t('setInstType')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INSTITUTION_TYPES.map(type => {
              const Icon = type.icon;
              const active = form.institutionType === type.value;
              const disabled = !canEdit('institutionType');
              return (
                <button key={type.value} onClick={() => !disabled && set('institutionType', type.value)} disabled={disabled}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{t(type.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t(type.descKey)}</p>
                  </div>
                  {active && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Timetable Header ── */}
      <Section title={t('setHeaderTitle')} icon={FileText} t={t}>
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>{t('setHeaderInfo')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('setSemester')} placeholder={t('setSemesterPh')} value={form.semester} onChange={v => set('semester', v)} />
          <Field label={t('setCohort')} placeholder={t('setCohortPh')} value={form.cohort} onChange={v => set('cohort', v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('setCurrentWeek')}</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="52" value={form.currentWeek} disabled={!canEdit('currentWeek')}
                onChange={e => set('currentWeek', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
              <span className="text-muted-foreground font-medium">/</span>
              <input type="number" min="1" max="52" value={form.totalWeeks} disabled={!canEdit('totalWeeks')}
                onChange={e => set('totalWeeks', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
            </div>
          </div>
          <Field label={t('setCity')} placeholder={t('setCityPh')} value={form.city}
            onChange={v => set('city', v)} disabled={!canEdit('city')} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t('setRefPrefix')} {!canEdit('refPrefix') && <Lock className="inline w-3 h-3 ml-1" />}
          </label>
          <input type="text" value={form.refPrefix} disabled={!canEdit('refPrefix')}
            onChange={e => set('refPrefix', e.target.value)} placeholder={t('setRefPrefixPh')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">{refPreview}</p>
        </div>
      </Section>

      {/* ── Signature (admin only) ── */}
      <Section title={t('setSignature')} icon={User} locked={!isAdmin} t={t}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('setSignerTitle')} placeholder={t('setSignerTitlePh')} value={form.directorTitle}
            onChange={v => set('directorTitle', v)} disabled={!canEdit('directorTitle')} />
          <Field label={t('setSignerName')} placeholder={t('setSignerNamePh')} value={form.directorName}
            onChange={v => set('directorName', v)} disabled={!canEdit('directorName')} />
        </div>
      </Section>

      {/* ── Schedule Options ── */}
      <Section title={t('setOptions')} icon={Calendar} t={t}>
        <Toggle label={t('setIncludeSat')}
          description={form.institutionType === 'secondary' ? t('setSatDescSec') : t('setSatDescUni')}
          value={form.showSaturday} onChange={v => set('showSaturday', v)} />
        {form.institutionType !== 'secondary' && (
          <Toggle label={t('setIncludeSun')}
            description={t('setSunDesc')}
            value={form.showSunday} onChange={v => set('showSunday', v)} />
        )}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">{t('setDisplayLang')}</label>
          <div className="flex gap-2">
            {[{ value: 'fr', label: '🇫🇷 Français' }, { value: 'en', label: '🇬🇧 English' }].map(opt => (
              <button key={opt.value} onClick={() => set('language', opt.value)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.language === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── User management (admin only) ── */}
      {isAdmin && (
        <Section title={t('setUserMgmt')} icon={Users} t={t}>
          <p className="text-xs text-muted-foreground">{t('setUserMgmtHint')}</p>

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.role === ROLES.ADMIN ? t('setRoleAdmin') : t('setRoleTimetabler')}</p>
                </div>
                {u.id !== user?.id && (
                  <button onClick={() => handleDeleteUser(u.id)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t('setAddAccount')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={newUser.fullName} onChange={e => setNewUser(u => ({ ...u, fullName: e.target.value }))}
                placeholder={t('setFullNamePh')} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                placeholder={t('setEmailPh')} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                placeholder={t('setPwPh')} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                <option value={ROLES.TIMETABLER}>{t('setRoleTimetabler')}</option>
                <option value={ROLES.ADMIN}>{t('setRoleAdmin')}</option>
              </select>
            </div>
            <button onClick={handleAddUser}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
              {t('setCreateAccount')}
            </button>
            {userMsg && <p className="text-xs text-muted-foreground">{userMsg}</p>}
          </div>
        </Section>
      )}

      {/* ── Backup (admin only) ── */}
      {isAdmin && (
        <Section title={t('setBackup')} icon={Shield} t={t}>
          <p className="text-xs text-muted-foreground">{t('setBackupHint')}</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
              <Download className="w-4 h-4" /> {t('setExportBackup')}
            </button>
            <button onClick={() => backupRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
              <Upload className="w-4 h-4" /> {t('setImportBackup')}
            </button>
            <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
          </div>
          {backupMsg && <p className="text-xs text-muted-foreground">{backupMsg}</p>}
        </Section>
      )}

      {/* ── Specialities Reference ── */}
      <Section title={t('setSpecRef')} icon={GraduationCap} t={t}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(CAMEROON_SPECIALITIES).map(([name, meta]) => (
            <div key={name} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <span className="text-xs font-mono text-primary font-bold w-10 shrink-0">{meta.code}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{specialityLabel(name, lang)}</p>
                <p className="text-[10px] text-muted-foreground">{meta.dept}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3 pb-6">
        <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {t('setSave')}
        </motion.button>
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-slate-800">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{t('setSaved')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, locked, children, t }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        {locked && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" /> {t ? t('setAdminOnly') : 'Admin uniquement'}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, placeholder, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label} {disabled && <Lock className="inline w-3 h-3 ml-1 text-amber-500" />}
      </label>
      <input type="text" value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function LogoBox({ label, value, onClear, onUpload, disabled }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {value ? (
        <div className="relative group">
          <img src={value} alt={label} className="w-16 h-16 object-contain border border-border rounded-xl bg-muted/30" />
          {!disabled && (
            <button onClick={onClear}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ) : (
        <div onClick={disabled ? undefined : onUpload}
          className={`w-16 h-16 border-2 border-dashed border-border rounded-xl bg-muted/30 flex flex-col items-center justify-center text-muted-foreground ${disabled ? 'opacity-50' : 'cursor-pointer hover:border-primary'} transition-colors`}>
          <Upload className="w-5 h-5 mb-1" />
        </div>
      )}
      <button onClick={disabled ? undefined : onUpload} disabled={disabled}
        className="text-[10px] text-primary hover:underline disabled:opacity-50 disabled:no-underline">{label}</button>
    </div>
  );
}
