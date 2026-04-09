import { queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiNotFound, apiInternalError } from '@/lib/api/response';

export const GET = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const row = await queryOne(
      'SELECT * FROM contacts WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (!row) return apiNotFound('Contact not found');
    return apiResponse(row);
  } catch (err) {
    return apiInternalError(err);
  }
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.isRead !== undefined) {
      fields.push(`is_read = $${idx++}`);
      values.push(body.isRead);
    }
    if (body.repliedAt !== undefined) {
      fields.push(`replied_at = $${idx++}`);
      values.push(body.repliedAt);
    }

    if (fields.length === 0) return apiResponse({ message: 'No fields to update' });

    values.push(id);
    const row = await queryOne(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!row) return apiNotFound('Contact not found');
    return apiResponse(row);
  } catch (err) {
    return apiInternalError(err);
  }
});

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const affected = await execute(
      'UPDATE contacts SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (affected === 0) return apiNotFound('Contact not found');
    return apiResponse({ message: 'Contact deleted' });
  } catch (err) {
    return apiInternalError(err);
  }
});
