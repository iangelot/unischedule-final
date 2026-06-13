import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import { createUser, ROLES } from '../lib/auth';
import { setSetting } from '../db';
import { useAppStore } from '../store/useAppStore';
import { login as apiLogin } from '../api';
import { t } from '../lib/uiStrings';
import LanguageToggle from '../components/LanguageToggle';

export default function Setup() {
  const navigate = useNavigate();
  const login = useAppStore(s => s.login);
  const lang = useAppStore(s => s.language);

  const [step, setStep] = useState(1);
  const [institutionName, setInstitutionName] = useState('');
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showTimetabler, setShowTimetabler] = useState(false);
  const [ttName, setTtName]           = useState('');
  const [ttEmail, setTtEmail]         = useState('');
  const [ttPassword, setTtPassword]   = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleFinish = async () => {
    setError('');
    if (password.length < 6) { setError(t(lang, 'errPasswordShort')); return; }
    if (password !== confirm) { setError(t(lang, 'errPasswordMatch')); return; }
    if (!email.trim() || !fullName.trim() || !institutionName.trim()) {
      setError(t(lang, 'errRequired')); return;
    }
    if (showTimetabler) {
      if (!ttName.trim() || !ttEmail.trim() || ttPassword.length < 6) {
        setError(t(lang, 'errTimetabler')); return;
      }
    }

    setLoading(true);
    try {
      await setSetting('institutionName', institutionName.trim());
      const slug = institutionName.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      await setSetting('slug', slug || 'etablissement');

      await createUser({ email, password, fullName, role: ROLES.ADMIN });

      if (showTimetabler) {
        await createUser({ email: ttEmail, password: ttPassword, fullName: ttName, role: ROLES.TIMETABLER });
      }

      const result = await apiLogin(email, password);
      if (result.success && result.token) {
        login({ token: result.token, user: result.user });
        // App detects new user via live query — go straight to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Account exists but auto-login failed — send to login page
        navigate('/login', { replace: true, state: { message: t(lang, 'errLoginAfterSetup') } });
      }
    } catch (e) {
      setError(e.message || t(lang, 'errSetup'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center p-6 font-sans relative">
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass rounded-3xl p-8 sm:p-10 shadow-2xl"
      >
        <div className="mb-6">
          <AppLogo size="md" onDark className="max-w-[220px] mb-3" />
          <h1 className="text-lg font-bold text-white">{t(lang, 'setupTitle')}</h1>
          <p className="text-xs text-slate-300">{t(lang, 'setupStep')(step)}</p>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-400' : 'bg-primary-800'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 bg-primary-900/40 rounded-xl p-4 text-sm text-primary-200">
              <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
              <p>{t(lang, 'setupInfo')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary-200 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {t(lang, 'institutionName')} *
              </label>
              <input
                type="text" value={institutionName} onChange={e => setInstitutionName(e.target.value)}
                placeholder={t(lang, 'institutionPlaceholder')}
                className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3.5 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button onClick={() => {
              if (institutionName.trim()) { setError(''); setStep(2); }
              else setError(t(lang, 'errInstitution'));
            }}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2">
              {t(lang, 'continue')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-primary-200">{t(lang, 'step2Intro')}</p>

            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder={t(lang, 'fullNamePlaceholder')}
              className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />

            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t(lang, 'emailPlaceholder')}
              className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />

            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t(lang, 'password')}
                className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder={t(lang, 'confirmPassword')}
              className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />

            {/* Optional — collapsed by default */}
            <div className="pt-2 border-t border-primary-800/50">
              <button type="button" onClick={() => setShowTimetabler(v => !v)}
                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-200 transition-colors w-full text-left">
                {showTimetabler ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {t(lang, 'addOtherLater')}
              </button>
              <p className="text-[10px] text-primary-500 mt-1 ml-5">{t(lang, 'addTimetablerHint')}</p>

              {showTimetabler && (
                <div className="space-y-3 mt-3 pl-4 border-l-2 border-primary-700">
                  <input type="text" value={ttName} onChange={e => setTtName(e.target.value)}
                    placeholder={t(lang, 'timetablerName')}
                    className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="email" value={ttEmail} onChange={e => setTtEmail(e.target.value)}
                    placeholder={t(lang, 'timetablerEmail')}
                    className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="password" value={ttPassword} onChange={e => setTtPassword(e.target.value)}
                    placeholder={t(lang, 'timetablerPassword')}
                    className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-primary-700 text-primary-300 text-sm hover:bg-primary-900/50">
                {t(lang, 'back')}
              </button>
              <button type="button" onClick={handleFinish} disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? t(lang, 'configuring') : <>{t(lang, 'finishSetup')} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
