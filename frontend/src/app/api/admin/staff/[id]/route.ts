import { NextRequest } from 'next/server';
import { createTranslatableCrud } from '@/lib/api/translatable-crud';
import { execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiNotFound, apiBadRequest, apiInternalError } from '@/lib/api/response';
import { employeesDev } from '@/app/api/admin/employees/_devStore';

const crud = createTranslatableCrud({
  table: 'staff',
  translationTable: 'staff_translations',
  foreignKey: 'staff_id',
  extraColumns: ['slug', 'image_url'],
  translationColumns: ['name', 'title', 'bio'],
});

export const GET = crud.GET_ONE;
export const PATCH = crud.PATCH;

// Hard delete the staff entity. The list view at /admin/staff actually shows
// rows from the `employees` table while the edit form here lives on the
// `staff` (translatable) table — so we attempt both. If any tear-down deletes
// at least one row we report success; if every table reports zero affected, we
// return 404 instead of a 500.
//
// Errors are categorised:
//   - foreign-key violation → 400 with a hint to deactivate
//   - missing relation / invalid UUID → treated as "not present" and skipped
//   - everything else → bubble up to apiInternalError
export const DELETE = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const { id } = await ctx.params;

    let totalAffected = 0;
    let fkBlocked = false;

    type Step = { sql: string; params?: unknown[] };
    const steps: Step[] = [
      { sql: `DELETE FROM staff_translations WHERE staff_id = $1`, params: [id] },
      { sql: `DELETE FROM staff WHERE id = $1`,                    params: [id] },
      { sql: `DELETE FROM employees WHERE id = $1`,                params: [id] },
    ];

    for (const step of steps) {
      try {
        const n = await execute(step.sql, step.params);
        totalAffected += n;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (/foreign key|violates/i.test(msg)) { fkBlocked = true; continue; }
        // Tolerate a missing table or bad-UUID input — that just means the
        // row didn't exist in this table, not that the request failed.
        if (/relation .* does not exist|invalid input syntax|undefined_table/i.test(msg)) continue;
        throw e;
      }
    }

    if (totalAffected > 0) return apiResponse({ message: 'Deleted' });
    if (fkBlocked) {
      return apiBadRequest(
        'Энэ ажилтан өмнөх захиалгуудтай холбоотой тул бүрмөсөн устгах боломжгүй. Идэвхгүй болгоно уу.',
      );
    }

    // Dev fallback — every DB attempt was skipped (missing table / bad UUID
    // because we're running on mock data). Try the in-memory employees store.
    if (process.env.NODE_ENV !== 'production' && employeesDev.remove(id)) {
      return apiResponse({ message: 'Deleted' });
    }

    return apiNotFound('Staff not found');
  } catch (err) {
    return apiInternalError(err);
  }
});
