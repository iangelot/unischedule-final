import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
  userId: string;
  institutionId: string;
  role: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
}

export function signRefreshToken(payload: Pick<JWTPayload, 'userId' | 'institutionId'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as any);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): Pick<JWTPayload, 'userId' | 'institutionId'> {
  return jwt.verify(token, JWT_REFRESH_SECRET) as any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return req.cookies.get('token')?.value || null;
}

export function getAuthUser(req: NextRequest): JWTPayload | null {
  try {
    const token = extractToken(req);
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

const ROLE_LEVELS: Record<string, number> = {
  viewer: 1, lecturer: 2, timetabler: 3, admin: 4, superadmin: 5,
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}
