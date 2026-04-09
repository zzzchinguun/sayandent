import { query, queryOne } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { hashPassword } from '@/lib/auth/password';
import { parsePagination } from '@/lib/api/pagination';
import { apiResponse, apiResponsePaginated, apiBadRequest, apiInternalError } from '@/lib/api/response';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT id, email, name, role, created_at, updated_at FROM admin_users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [pageSize, skip]
      ),
      query<{ count: string }>('SELECT COUNT(*) as count FROM admin_users'),
    ]);

    const total = parseInt(countResult[0]?.count ?? '0', 10);
    return apiResponsePaginated(rows, { page, pageSize, total });
  } catch (err) {
    return apiInternalError(err);
  }
}, 'superadmin');

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return apiBadRequest('Email, password, and name are required');
    }

    const existing = await queryOne('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing) return apiBadRequest('Email already exists');

    const passwordHash = await hashPassword(password);
    const row = await queryOne<{ id: string; email: string; name: string; role: string }>(
      `INSERT INTO admin_users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [email, passwordHash, name, role || 'admin']
    );

    return apiResponse(row, 201);
  } catch (err) {
    return apiInternalError(err);
  }
}, 'superadmin');
