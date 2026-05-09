import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiBadRequest, apiInternalError } from '@/lib/api/response';
import { devStore, type WishlistItem } from './_devStore';

const MIN_TITLE = 4;
const MIN_DESCRIPTION = 20;

export const GET = withAuth(async () => {
  try {
    const rows = await query(
      `SELECT id, title, description, created_by_email, created_by_name, created_at, updated_at
       FROM wishlist
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`,
    );
    return apiResponse(rows);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      return apiResponse(devStore.list());
    }
    return apiInternalError(err);
  }
});

export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  try {
    const body = await req.json();
    const title = (body.title ?? '').toString().trim();
    const description = (body.description ?? '').toString().trim();

    if (title.length < MIN_TITLE) {
      return apiBadRequest(`Гарчиг хэт богино байна. Доод тал нь ${MIN_TITLE} тэмдэгт.`);
    }
    if (description.length < MIN_DESCRIPTION) {
      return apiBadRequest(
        `Тайлбар хэт богино байна. Доод тал нь ${MIN_DESCRIPTION} тэмдэгт. Нэмэлт нөхцөл, жишээ, шалтгаан зэргийг дэлгэрэнгүй бичнэ үү.`,
      );
    }

    try {
      const row = await queryOne(
        `INSERT INTO wishlist (title, description, created_by_email, created_by_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description, user.email, user.name],
      );
      return apiResponse(row, 201);
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        const item: WishlistItem = devStore.create({
          title,
          description,
          created_by_email: user.email,
          created_by_name: user.name,
        });
        return apiResponse(item, 201);
      }
      throw new Error('Database insert failed');
    }
  } catch (err) {
    return apiInternalError(err);
  }
});
