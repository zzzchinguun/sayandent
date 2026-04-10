import { queryOne } from '@/lib/db/client';
import { parseBody } from '@/lib/api/validate';
import { contactCreateSchema } from '@/lib/validations/contact';
import { apiResponse, apiInternalError } from '@/lib/api/response';
import { sendClinicNotification, contactEmailHTML } from '@/lib/email/resend';

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, contactCreateSchema);
    if ('error' in parsed) return parsed.error;

    const { name, email, phone, message } = parsed.data;

    // DB write is best-effort — if Postgres is unreachable we still send the
    // email and report success. The email is the load-bearing path.
    let id: string | null = null;
    try {
      const row = await queryOne<{ id: string }>(
        `INSERT INTO contacts (name, email, phone, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [name, email, phone ?? null, message]
      );
      id = row?.id ?? null;
    } catch (dbErr) {
      console.error('[contact] DB insert failed, continuing to email:', dbErr);
    }

    // Email notification — best-effort, don't block response on failure.
    void sendClinicNotification({
      subject: `New contact: ${name}`,
      html: contactEmailHTML({ name, email, phone, message }),
      replyTo: email,
    });

    return apiResponse({ id, message: 'Message sent successfully' }, 201);
  } catch (err) {
    return apiInternalError(err);
  }
}
