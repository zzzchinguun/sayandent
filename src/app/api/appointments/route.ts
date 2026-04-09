import { queryOne } from '@/lib/db/client';
import { parseBody } from '@/lib/api/validate';
import { appointmentCreateSchema } from '@/lib/validations/appointment';
import { apiResponse, apiInternalError } from '@/lib/api/response';
import { sendClinicNotification, appointmentEmailHTML } from '@/lib/email/resend';

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, appointmentCreateSchema);
    if ('error' in parsed) return parsed.error;

    const { fullName, phone, email, preferredDate, preferredTime, serviceType, notes } = parsed.data;

    const row = await queryOne<{ id: string }>(
      `INSERT INTO appointments (full_name, phone, email, preferred_date, preferred_time, service_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [fullName, phone, email, preferredDate, preferredTime, serviceType, notes ?? null]
    );

    // Email notification — best-effort, don't block response on failure.
    void sendClinicNotification({
      subject: `New appointment: ${fullName} — ${preferredDate} ${preferredTime}`,
      html: appointmentEmailHTML({ fullName, email, phone, preferredDate, preferredTime, serviceType, notes }),
      replyTo: email,
    });

    return apiResponse({ id: row!.id, message: 'Appointment booked successfully' }, 201);
  } catch (err) {
    return apiInternalError(err);
  }
}
