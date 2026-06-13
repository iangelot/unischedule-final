import { useAppStore } from '../store/useAppStore';

export default function LanguageToggle({ className = '' }) {
  const language = useAppStore(s => s.language);
  const setLanguage = useAppStore(s => s.setLanguage);

  return (
    <div className={`flex items-center gap-1 rounded-full bg-primary-900/60 border border-primary-700/50 p-0.5 ${className}`}>
      {['fr', 'en'].map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition-colors ${
            language === lang
              ? 'bg-primary-500 text-white'
              : 'text-primary-400 hover:text-primary-200'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
