import { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle, HardDrive, CheckCircle2 } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import { useAppStore } from '../store/useAppStore';
import { login as apiLogin } from '../api';
import { t } from '../lib/uiStrings';
import LanguageToggle from '../components/LanguageToggle';

export default function Login() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locked = searchParams.get('locked') === '1';
  const lang = useAppStore(s => s.language);

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]         = useState(
    locked ? t(lang, 'loginLocked') : ''
  );
  const [successMsg] = useState(location.state?.message || '');
  const login = useAppStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await apiLogin(email, password);

    if (result.success && result.token) {
      login({ token: result.token, user: result.user });
    } else {
      setError(result.error || t(lang, 'loginWrong'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 flex relative overflow-hidden font-sans">
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary-800 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-accent-600 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 relative z-10">

        {/* Left Side — Brand & Value Prop */}
        <div className="hidden lg:flex flex-col justify-center px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="mb-8">
              <AppLogo size="xl" onDark className="max-w-[280px]" />
            </div>

            <h2 className="text-5xl font-extrabold text-white leading-[1.1] mb-6">
              Next-Gen <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-400">
                Timetable Intelligence
              </span>
            </h2>

            <p className="text-primary-200 text-lg mb-10 max-w-md leading-relaxed">
              Automate complex scheduling constraints natively designed for African educational infrastructure.
            </p>

            <div className="space-y-6">
              {[
                { title: '100% Local',               desc: 'Fonctionne sur votre ordinateur, sans internet ni serveur.' },
                { title: 'Export PDF → WhatsApp',    desc: 'Générez l\'emploi du temps, exportez en PDF, partagez aux étudiants.' },
                { title: 'Double-Shift Native',      desc: 'Conçu pour les créneaux Matin & Soir des établissements africains.' },
              ].map((feature, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  key={i}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary-800/50 flex items-center justify-center border border-primary-700/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-300" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                    <p className="text-primary-300 text-xs mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side — Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="w-full max-w-md glass rounded-3xl p-8 sm:p-10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-transparent rounded-bl-full pointer-events-none" />

            <AppLogo size="md" onDark className="lg:hidden max-w-[200px] mb-6" />

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{t(lang, 'loginTitle')}</h3>
              <p className="text-primary-200 text-sm">{t(lang, 'loginSubtitle')}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-primary-400">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{t(lang, 'loginLocal')}</span>
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 flex items-center gap-3 bg-white/10 border border-white/25 text-white text-sm rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary-200 uppercase tracking-wider ml-1">
                    {t(lang, 'email')}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@institution.edu"
                    className="w-full bg-primary-950/50 border border-primary-800 rounded-xl px-4 py-3.5 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-primary-200 uppercase tracking-wider">
                      {t(lang, 'password').split('(')[0].trim()}
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-primary-950/50 border border-primary-800 rounded-xl pl-11 pr-11 py-3.5 text-white placeholder:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-300 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="login-submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-4 font-semibold text-sm shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t(lang, 'loginAuthenticating')}
                    </>
                  ) : (
                    <>{t(lang, 'loginSubmit')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </form>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
