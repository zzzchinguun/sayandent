import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db/client';
import { comparePassword } from '@/lib/auth/password';
import { signToken, TOKEN_COOKIE_NAME } from '@/lib/auth/jwt';
import { parseBody } from '@/lib/api/validate';
import { loginSchema } from '@/lib/validations/auth';
import { apiResponse, apiBadRequest, apiInternalError } from '@/lib/api/response';

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, loginSchema);
    if ('error' in parsed) return parsed.error;

    const { email, password } = parsed.data;

    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role: string;
    }>('SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1', [email]);

    if (!user) return apiBadRequest('Invalid email or password');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return apiBadRequest('Invalid email or password');

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    });

    return apiResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    return apiInternalError(err);
  }
}
