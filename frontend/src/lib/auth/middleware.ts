import { cookies } from 'next/headers';
import { verifyToken, TOKEN_COOKIE_NAME, type JWTPayload } from './jwt';
import { apiUnauthorized, apiForbidden } from '@/lib/api/response';

type RouteContext = { params: Promise<Record<string, string>> };

export function withAuth(
  handler: (req: Request, ctx: RouteContext, user: JWTPayload) => Promise<Response>,
  requiredRole?: 'superadmin'
) {
  return async (req: Request, ctx: RouteContext) => {
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
