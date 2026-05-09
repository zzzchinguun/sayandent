import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyToken, TOKEN_COOKIE_NAME, type JWTPayload } from './jwt';
import { apiUnauthorized, apiForbidden } from '@/lib/api/response';

type RouteContext = { params: Promise<Record<string, string>> };

// Accept both `Request` and `NextRequest` so callers can use whichever type
// matches their handler. Next.js passes `NextRequest` at runtime regardless.
export function withAuth<R extends Request | NextRequest = NextRequest>(
  handler: (req: R, ctx: RouteContext, user: JWTPayload) => Promise<Response>,
  requiredRole?: 'superadmin'
) {
  return async (req: R, ctx: RouteContext) => {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return apiUnauthorized();

    const user = await verifyToken(token);
    if (!user) return apiUnauthorized('Invalid or expired token');

    if (requiredRole && user.role !== requiredRole) {
      return apiForbidden();
    }

    return handler(req, ctx, user);
  };
}
