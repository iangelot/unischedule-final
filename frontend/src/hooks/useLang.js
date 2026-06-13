import { useAppStore } from '../store/useAppStore';
import { t as translate } from '../lib/uiStrings';

export function useLang() {
  const lang = useAppStore(s => s.language);
  const t = (key, ...args) => translate(lang, key, ...args);
  return { lang, t };
}
