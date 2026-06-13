import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionLock() {
  const logout = useAppStore(s => s.logout);
  const touchSession = useAppStore(s => s.touchSession);

  const resetTimer = useCallback(() => {
    touchSession();
  }, [touchSession]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const interval = setInterval(() => {
      const last = parseInt(sessionStorage.getItem('lastActivity') || '0', 10);
      if (last && Date.now() - last > IDLE_MS) {
        logout();
        window.location.href = '/login?locked=1';
      }
    }, 60_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [resetTimer, logout]);
}
