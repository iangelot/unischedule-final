import { NextRequest } from 'next/server';
import { getAuthUser, hasRole, JWTPayload } from '@/lib/auth';
import { unauthorized, forbidden } from '@/lib/response';

type Handler = (req: NextRequest, ctx: { user: JWTPayload; params?: any }) => Promise<Response>;

export function withAuth(handler: Handler, requiredRole = 'viewer') {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    const user = getAuthUser(req);
    if (!user) return unauthorized('Please log in to continue');
    if (!hasRole(user.role, requiredRole)) return forbidden(`Requires role: ${requiredRole}`);
    // institutionId always comes from the verified JWT — never from the request body
    return handler(req, { user, params });
  };
}

export const withAdmin = (handler: Handler) => withAuth(handler, 'admin');
export const withTimetabler = (handler: Handler) => withAuth(handler, 'timetabler');
