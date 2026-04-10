import { query } from '@/lib/db/client';
import { apiResponse, apiInternalError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'mn';

    const rows = await query<{
      id: string;
      name: string;
      role: string;
      content: string;
      avatar: string | null;
      sort_order: number;
    }>(
      `SELECT t.id, tt.name, tt.role, tt.content, tt.avatar, t.sort_order
       FROM testimonials t
       JOIN testimonial_translations tt ON tt.testimonial_id = t.id AND tt.locale = $1
       WHERE t.is_active = true AND t.deleted_at IS NULL
       ORDER BY t.sort_order ASC`,
      [locale]
    );

    return apiResponse(rows);
  } catch (err) {
    return apiInternalError(err);
  }
}
