import bcrypt from 'bcryptjs';
import { db } from '../db';

export const ROLES = {
  ADMIN: 'admin',
  TIMETABLER: 'timetabler',
};

// Settings only an admin may change (official branding / identity)
export const ADMIN_ONLY_SETTINGS = [
  'institutionName', 'schoolName', 'institutionType', 'slug',
  'logo', 'logo2', 'directorTitle', 'directorName', 'refPrefix', 'city',
];

const SALT_ROUNDS = 10;

function makeId() {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function hasUsers() {
  return (await db.users.count()) > 0;
}

export async function createUser({ email, password, fullName, role }) {
  const normalized = email.trim().toLowerCase();
  const existing = await db.users.where('email').equals(normalized).first();
  if (existing) throw new Error('Un compte avec cet email existe déjà.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: makeId(),
    email: normalized,
    passwordHash,
    fullName: fullName.trim(),
    role,
    createdAt: Date.now(),
  };
  await db.users.add(user);
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}

export async function localLogin(email, password) {
  const normalized = email.trim().toLowerCase();
  const record = await db.users.where('email').equals(normalized).first();

  if (!record) {
    return { success: false, error: 'Email ou mot de passe incorrect.' };
  }

  const valid = await bcrypt.compare(password, record.passwordHash);
  if (!valid) {
    return { success: false, error: 'Email ou mot de passe incorrect.' };
  }

  const user = {
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    role: record.role,
  };

  return { success: true, token: `local_${record.id}`, user };
}

export async function listUsers() {
  const users = await db.users.toArray();
  return users.map(({ passwordHash, ...u }) => u);
}

export async function deleteUser(id) {
  const count = await db.users.count();
  if (count <= 1) throw new Error('Impossible de supprimer le dernier compte.');
  await db.users.delete(id);
}

export async function changePassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.users.update(userId, { passwordHash: hash });
}

export function canEditSetting(key, role) {
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.TIMETABLER) return !ADMIN_ONLY_SETTINGS.includes(key);
  return false;
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}
