import { cookies } from 'next/headers';
import { TOKEN_COOKIE_NAME } from '@/lib/auth/jwt';
import { apiResponse } from '@/lib/api/response';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
  return apiResponse({ message: 'Logged out' });
}
