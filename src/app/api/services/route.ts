import { query } from '@/lib/db/client';
import { apiResponse, apiInternalError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'mn';

    const rows = await query<{
      id: string;
      slug: string;
      title: string;
      description: string;
      sort_order: number;
    }>(
      `SELECT s.id, s.slug, st.title, st.description, s.sort_order
       FROM services s
       JOIN service_translations st ON st.service_id = s.id AND st.locale = $1
       WHERE s.is_active = true AND s.deleted_at IS NULL
       ORDER BY s.sort_order ASC`,
      [locale]
    );

    return apiResponse(rows);
  } catch (err) {
    return apiInternalError(err);
  }
}
