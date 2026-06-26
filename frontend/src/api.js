import { localLogin } from './lib/auth';

// This app is fully offline (IndexedDB/Dexie) — there is no server to call.
// Authentication is local; everything else reads/writes Dexie directly.
// (Optional multi-campus sync against the backend/ API is a Phase 2 path and
// is intentionally NOT wired here — see backend/README.md.)

export async function login(email, password) {
  try {
    return await localLogin(email, password);
  } catch {
    return { success: false, error: 'Erreur de connexion. Réessayez.' };
  }
}
