import { db } from './db';
import { localLogin } from './lib/auth';

export const API_BASE = '/api';

// ── Session helpers (sessionStorage — cleared when browser closes) ──

export function setToken(token) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('lastActivity', String(Date.now()));
}

export function getToken() {
  return sessionStorage.getItem('token');
}

export function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('lastActivity');
  window.location.href = '/login';
}

// ── Local auth (no server required) ────────────────────────────────

export async function login(email, password) {
  try {
    return await localLogin(email, password);
  } catch {
    return { success: false, error: 'Erreur de connexion. Réessayez.' };
  }
}

// ── Offline fetch fallback (legacy — reads from Dexie) ─────────────

export async function fetchWithOfflineSupport(endpoint, storeName) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (res.status === 401) { logout(); return []; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const data = json.data ?? json;
    if (storeName && data && Array.isArray(data)) {
      await db[storeName].bulkPut(data);
    }
    return data;
  } catch {
    if (storeName) return db[storeName].toArray();
    return [];
  }
}
