import { z } from 'zod';
import { query, queryOne } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parsePagination } from '@/lib/api/pagination';
import { parseBody } from '@/lib/api/validate';
import { apiResponse, apiResponsePaginated, apiInternalError } from '@/lib/api/response';

const createAppointmentSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  scheduled_at: z.string().min(1),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  doctor_id: z.string().uuid().optional(),
  service_type: z.string().min(1).default('Анхан үзлэг'),
  notes: z.string().optional(),
  source: z.enum(['online', 'manual']).default('manual'),
  status: z
    .enum(['booked', 'arrived', 'examined', 'paid', 'cancelled_by_patient', 'cancelled_by_doctor'])
    .default('booked'),
});

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

export const POST = withAuth(async (req) => {
  const parsed = await parseBody(req, createAppointmentSchema);
  if ('error' in parsed) return parsed.error;
  const d = parsed.data;

  const scheduled = new Date(d.scheduled_at);
  if (isNaN(scheduled.getTime())) {
    return apiInternalError(new Error('Invalid scheduled_at'));
  }

  try {
    const row = await queryOne(
      `INSERT INTO appointments
         (full_name, phone, email, scheduled_at, duration_minutes, doctor_id, service_type, notes, source, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        d.full_name,
        d.phone,
        d.email ?? null,
        scheduled.toISOString(),
        d.duration_minutes,
        d.doctor_id ?? null,
        d.service_type,
        d.notes ?? null,
        d.source,
        d.status,
      ],
    );
    return apiResponse(row, 201);
  } catch (err) {
    return apiInternalError(err);
  }
});
