import { query } from '@/lib/db/client';
import { apiResponse, apiInternalError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'mn';

    const rows = await query<{
      id: string;
      question: string;
      answer: string;
      sort_order: number;
    }>(
      `SELECT f.id, ft.question, ft.answer, f.sort_order
       FROM faqs f
       JOIN faq_translations ft ON ft.faq_id = f.id AND ft.locale = $1
       WHERE f.is_active = true AND f.deleted_at IS NULL
       ORDER BY f.sort_order ASC`,
      [locale]
    );

    return apiResponse(rows);
  } catch (err) {
    return apiInternalError(err);
  }
}
