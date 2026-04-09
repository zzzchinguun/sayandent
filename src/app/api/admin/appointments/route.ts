import { query } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parsePagination } from '@/lib/api/pagination';
import { apiResponsePaginated, apiInternalError } from '@/lib/api/response';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePagination(searchParams);
    const status = searchParams.get('status');

    const whereClause = status
      ? 'WHERE a.deleted_at IS NULL AND a.status = $3'
      : 'WHERE a.deleted_at IS NULL';
    const params = status ? [pageSize, skip, status] : [pageSize, skip];

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT a.* FROM appointments a ${whereClause} ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
        params
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM appointments a ${whereClause}`,
        status ? [status] : []
      ),
    ]);

    const total = parseInt(countResult[0]?.count ?? '0', 10);
    return apiResponsePaginated(rows, { page, pageSize, total });
  } catch (err) {
    return apiInternalError(err);
  }
});
