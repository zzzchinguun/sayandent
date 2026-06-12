import { queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parseBody } from '@/lib/api/validate';
import { appointmentUpdateSchema } from '@/lib/validations/appointment';
import { apiResponse, apiNotFound, apiInternalError } from '@/lib/api/response';
import { findDevAppointmentById } from '@/lib/dev/calendar-fixtures';

export const GET = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const row = await queryOne(
      `SELECT a.*, trim(e.last_name || ' ' || e.first_name) AS doctor_name
       FROM appointments a
       LEFT JOIN employees e ON e.id = a.doctor_id
       WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [id]
    );
    if (row) return apiResponse(row);

    if (process.env.NODE_ENV !== 'production') {
      const fake = findDevAppointmentById(id);
      if (fake) return apiResponse(fake);
    }
    return apiNotFound('Appointment not found');
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const { id } = await ctx.params;
      const fake = findDevAppointmentById(id);
      if (fake) return apiResponse(fake);
    }
    return apiInternalError(err);
  }
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = await ctx.params;
    const parsed = await parseBody(req, appointmentUpdateSchema);
    if ('error' in parsed) return parsed.error;

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const columnMap: Record<string, string> = {
      fullName: 'full_name',
      phone: 'phone',
      email: 'email',
      preferredDate: 'preferred_date',
      preferredTime: 'preferred_time',
      serviceType: 'service_type',
      notes: 'notes',
      status: 'status',
      source: 'source',
      scheduledAt: 'scheduled_at',
      durationMinutes: 'duration_minutes',
      doctorId: 'doctor_id',
    };

    for (const [key, col] of Object.entries(columnMap)) {
      if (parsed.data[key as keyof typeof parsed.data] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(parsed.data[key as keyof typeof parsed.data]);
      }
    }

    if (fields.length === 0) return apiResponse({ message: 'No fields to update' });

    values.push(id);
    const row = await queryOne(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!row) return apiNotFound('Appointment not found');
    return apiResponse(row);
  } catch (err) {
    return apiInternalError(err);
  }
});

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const affected = await execute(
      'UPDATE appointments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (affected === 0) return apiNotFound('Appointment not found');
    return apiResponse({ message: 'Appointment deleted' });
  } catch (err) {
    return apiInternalError(err);
  }
});
