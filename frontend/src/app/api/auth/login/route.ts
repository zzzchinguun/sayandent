import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db/client';
import { comparePassword } from '@/lib/auth/password';
import { signToken, TOKEN_COOKIE_NAME } from '@/lib/auth/jwt';
import { parseBody } from '@/lib/api/validate';
import { loginSchema } from '@/lib/validations/auth';
import { apiResponse, apiBadRequest, apiInternalError } from '@/lib/api/response';
import { employeesDev } from '@/app/api/admin/employees/_devStore';

const DEV_SEED_EMAIL = process.env.ADMIN_SEED_EMAIL;
const DEV_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;

// Dev-only: every mocked employee can log in.
// Username = their email (e.g. "batsanaa@sayandent.mn")
// Password = the email prefix before "@" (e.g. "batsanaa")
function tryDevEmployeeLogin(email: string, password: string) {
  const emp = employeesDev.list().find((e) => e.email?.toLowerCase() === email.toLowerCase());
  if (!emp || !emp.email) return null;
  if (!emp.is_active) return null;
  const expectedPassword = emp.email.split('@')[0];
  if (password !== expectedPassword) return null;
  return {
    sub: `emp-${emp.id}`,
    email: emp.email,
    role: emp.role || 'doctor',
    name: `${emp.last_name} ${emp.first_name}`.trim(),
  };
}

async function setTokenCookie(payload: { sub: string; email: string; role: string; name: string }) {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return payload;
}

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, loginSchema);
    if ('error' in parsed) return parsed.error;

    const { email, password } = parsed.data;

    // Seed credentials bypass — works in any environment if both env vars are
    // set. Useful when the DB is unreachable or hasn't been seeded yet. Set
    // ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD on Vercel to enable.
    if (
      DEV_SEED_EMAIL &&
      DEV_SEED_PASSWORD &&
      email === DEV_SEED_EMAIL &&
      password === DEV_SEED_PASSWORD
    ) {
      const devUser = { sub: 'seed-admin', email: DEV_SEED_EMAIL, role: 'superadmin', name: 'Админ' };
      await setTokenCookie(devUser);
      return apiResponse({ id: devUser.sub, email: devUser.email, name: devUser.name, role: devUser.role });
    }

    let user: {
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role: string;
    } | null = null;
    try {
      user = await queryOne<{
        id: string;
        email: string;
        password_hash: string;
        name: string;
        role: string;
      }>('SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1', [email]);
    } catch (e) {
      // DB or table missing — fall through to dev fallbacks below.
      // But log so production failures show up in Vercel function logs.
      console.error('[auth/login] admin_users query failed:', e);
      user = null;
    }
    console.log('[auth/login] user lookup', {
      email,
      found: !!user,
      hashPrefix: user?.password_hash?.slice(0, 7),
    });

    if (user) {
      const valid = await comparePassword(password, user.password_hash);
      if (!valid) return apiBadRequest('Invalid email or password');

      const userData = { sub: user.id, email: user.email, role: user.role, name: user.name };
      await setTokenCookie(userData);

      return apiResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    // Employees (doctors, receptionists, admins) log in with their work email.
    let emp: {
      id: string;
      email: string;
      password_hash: string | null;
      last_name: string;
      first_name: string;
      role: string;
    } | null = null;
    try {
      emp = await queryOne(
        `SELECT id, email, password_hash, last_name, first_name, role
         FROM employees
         WHERE lower(email) = lower($1) AND is_active = true AND deleted_at IS NULL`,
        [email],
      );
    } catch (e) {
      console.error('[auth/login] employees query failed:', e);
      emp = null;
    }

    if (emp?.password_hash) {
      const valid = await comparePassword(password, emp.password_hash);
      if (!valid) return apiBadRequest('Invalid email or password');

      const empData = {
        sub: emp.id,
        email: emp.email,
        role: emp.role,
        name: `${emp.last_name} ${emp.first_name}`.trim(),
      };
      await setTokenCookie(empData);

      return apiResponse({
        id: emp.id,
        email: emp.email,
        name: empData.name,
        role: emp.role,
      });
    }

    // Dev-only: allow logging in as any mocked employee
    if (process.env.NODE_ENV !== 'production') {
      const empUser = tryDevEmployeeLogin(email, password);
      if (empUser) {
        await setTokenCookie(empUser);
        return apiResponse({
          id: empUser.sub,
          email: empUser.email,
          name: empUser.name,
          role: empUser.role,
        });
      }
    }

    return apiBadRequest('Invalid email or password');
  } catch (err) {
    return apiInternalError(err);
  }
}
