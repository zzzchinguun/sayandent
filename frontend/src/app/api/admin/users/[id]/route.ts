import { queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiNotFound, apiBadRequest, apiInternalError } from '@/lib/api/response';

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name); }
    if (body.role !== undefined) {
      if (!['admin', 'superadmin'].includes(body.role)) return apiBadRequest('Invalid role');
      fields.push(`role = $${idx++}`);
      values.push(body.role);
    }

    if (fields.length === 0) return apiResponse({ message: 'No fields to update' });

    values.push(id);
    const row = await queryOne(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role`,
      values
    );
    if (!row) return apiNotFound('User not found');
    return apiResponse(row);
  } catch (err) {
    return apiInternalError(err);
  }
}, 'superadmin');

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const affected = await execute('DELETE FROM admin_users WHERE id = $1', [id]);
    if (affected === 0) return apiNotFound('User not found');
    return apiResponse({ message: 'User deleted' });
  } catch (err) {
    return apiInternalError(err);
  }
}, 'superadmin');
