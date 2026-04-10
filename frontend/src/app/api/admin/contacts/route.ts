import { query } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parsePagination } from '@/lib/api/pagination';
import { apiResponsePaginated, apiInternalError } from '@/lib/api/response';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePagination(searchParams);
    const isRead = searchParams.get('isRead');

    const conditions = ['c.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (isRead !== null) {
      params.push(isRead === 'true');
      conditions.push(`c.is_read = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    params.push(pageSize, skip);

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT c.* FROM contacts c ${whereClause} ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM contacts c ${whereClause}`,
        params.slice(0, -2)
      ),
    ]);

    const total = parseInt(countResult[0]?.count ?? '0', 10);
    return apiResponsePaginated(rows, { page, pageSize, total });
  } catch (err) {
    return apiInternalError(err);
  }
});
