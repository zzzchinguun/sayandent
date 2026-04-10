import { withAuth } from '@/lib/auth/middleware';
import { apiResponse } from '@/lib/api/response';

export const GET = withAuth(async (_req, _ctx, user) => {
  return apiResponse({
    id: user.sub,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});
