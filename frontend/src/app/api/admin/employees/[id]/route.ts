import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiNotFound, apiBadRequest, apiInternalError } from '@/lib/api/response';

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    const allowed = ['last_name', 'first_name', 'registry_number', 'email', 'role', 'phone', 'branch', 'address', 'is_active'] as const;
    for (const key of allowed) {
      if (key in body) {
        sets.push(`${key} = $${i++}`);
        vals.push(body[key]);
      }
    }

    if (sets.length === 0) {
      return apiResponse({ message: 'Nothing to update' });
    }

    vals.push(id);
    const count = await execute(
      `UPDATE employees SET ${sets.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
      vals,
    );

    if (count === 0) return apiNotFound('Employee not found');

    const updated = await queryOne(`SELECT * FROM employees WHERE id = $1`, [id]);
    return apiResponse(updated);
  } catch (err) {
    return apiInternalError(err);
  }
});

export const DELETE = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const { id } = await ctx.params;

    // Hard delete the employee. If there are FK references (e.g. an appointment
    // pointing at this employee as doctor), Postgres will raise — surface that
    // as a 400 so the UI can suggest deactivating instead.
    try {
      const count = await execute(`DELETE FROM employees WHERE id = $1`, [id]);
      if (count === 0) return apiNotFound('Employee not found');
      return apiResponse({ message: 'Deleted' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/foreign key|violates/i.test(msg)) {
        return apiBadRequest(
          'Энэ ажилтан өмнөх захиалгуудтай холбоотой тул бүрмөсөн устгах боломжгүй. Идэвхгүй болгоно уу.',
        );
      }
      throw e;
    }
  } catch (err) {
    return apiInternalError(err);
  }
});
