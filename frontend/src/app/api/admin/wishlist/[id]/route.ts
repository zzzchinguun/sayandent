import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiBadRequest, apiNotFound, apiInternalError } from '@/lib/api/response';
import { devStore } from '../_devStore';

const MIN_TITLE = 4;
const MIN_DESCRIPTION = 20;

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    if (typeof body.title === 'string') {
      const t = body.title.trim();
      if (t.length < MIN_TITLE) {
        return apiBadRequest(`Гарчиг хэт богино байна. Доод тал нь ${MIN_TITLE} тэмдэгт.`);
      }
      sets.push(`title = $${i++}`); vals.push(t);
    }
    if (typeof body.description === 'string') {
      const d = body.description.trim();
      if (d.length < MIN_DESCRIPTION) {
        return apiBadRequest(
          `Тайлбар хэт богино байна. Доод тал нь ${MIN_DESCRIPTION} тэмдэгт. Нэмэлт нөхцөл, жишээ, шалтгаан зэргийг дэлгэрэнгүй бичнэ үү.`,
        );
      }
      sets.push(`description = $${i++}`); vals.push(d);
    }

    if (sets.length === 0) return apiBadRequest('Шинэчлэх талбар алга');

    try {
      vals.push(id);
      const count = await execute(
        `UPDATE wishlist SET ${sets.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
        vals,
      );
      if (count === 0) {
        if (process.env.NODE_ENV !== 'production') {
          const updated = devStore.update(id, {
            title: typeof body.title === 'string' ? body.title.trim() : undefined,
            description: typeof body.description === 'string' ? body.description.trim() : undefined,
          });
          if (updated) return apiResponse(updated);
        }
        return apiNotFound('Wish not found');
      }
      const updated = await queryOne(`SELECT * FROM wishlist WHERE id = $1`, [id]);
      return apiResponse(updated);
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        const updated = devStore.update(id, {
          title: typeof body.title === 'string' ? body.title.trim() : undefined,
          description: typeof body.description === 'string' ? body.description.trim() : undefined,
        });
        if (updated) return apiResponse(updated);
        return apiNotFound('Wish not found');
      }
      throw new Error('Database update failed');
    }
  } catch (err) {
    return apiInternalError(err);
  }
});

export const DELETE = withAuth(async (_req: NextRequest, ctx) => {
  try {
    const { id } = await ctx.params;
    try {
      const count = await execute(
        `UPDATE wishlist SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (count === 0) {
        if (process.env.NODE_ENV !== 'production' && devStore.remove(id)) {
          return apiResponse({ message: 'Deleted' });
        }
        return apiNotFound('Wish not found');
      }
      return apiResponse({ message: 'Deleted' });
    } catch {
      if (process.env.NODE_ENV !== 'production' && devStore.remove(id)) {
        return apiResponse({ message: 'Deleted' });
      }
      throw new Error('Database delete failed');
    }
  } catch (err) {
    return apiInternalError(err);
  }
});
