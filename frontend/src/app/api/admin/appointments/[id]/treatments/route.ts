import { z } from 'zod';
import { query, queryOne, execute } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parseBody } from '@/lib/api/validate';
import { apiResponse, apiNotFound, apiInternalError } from '@/lib/api/response';

const itemSchema = z.object({
  tooth_code: z.string().max(8).nullish(),
  tooth_label: z.string().nullish(),
  diagnosis_code: z.string().nullish(),
  diagnosis_name: z.string().nullish(),
  treatment_name: z.string().min(1),
  price: z.number().int().min(0),
  discount: z.number().int().min(0).default(0),
  detail: z.string().nullish(),
});

const saveSchema = z.object({
  items: z.array(itemSchema),
  complaint: z.string().nullish(),
  insured: z.boolean().optional(),
  exam_fee: z.number().int().min(0).optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const appt = await queryOne(
      'SELECT id, complaint, insured, exam_fee FROM appointments WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    if (!appt) return apiNotFound('Appointment not found');

    const items = await query(
      `SELECT id, tooth_code, tooth_label, diagnosis_code, diagnosis_name,
              treatment_name, price, discount, detail
       FROM appointment_treatments
       WHERE appointment_id = $1
       ORDER BY created_at ASC, id ASC`,
      [id],
    );
    return apiResponse({
      items,
      complaint: appt.complaint,
      insured: appt.insured,
      exam_fee: appt.exam_fee,
    });
  } catch (err) {
    return apiInternalError(err);
  }
});

// Replace-all save: the client always sends the full current list.
export const PUT = withAuth(async (req, ctx) => {
  const parsed = await parseBody(req, saveSchema);
  if ('error' in parsed) return parsed.error;
  const { items, complaint, insured, exam_fee } = parsed.data;

  try {
    const { id } = await ctx.params;
    const appt = await queryOne(
      'SELECT id FROM appointments WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    if (!appt) return apiNotFound('Appointment not found');

    await execute('DELETE FROM appointment_treatments WHERE appointment_id = $1', [id]);

    for (const it of items) {
      await execute(
        `INSERT INTO appointment_treatments
           (appointment_id, tooth_code, tooth_label, diagnosis_code, diagnosis_name, treatment_name, price, discount, detail)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          id,
          it.tooth_code ?? null,
          it.tooth_label ?? null,
          it.diagnosis_code ?? null,
          it.diagnosis_name ?? null,
          it.treatment_name,
          it.price,
          it.discount,
          it.detail ?? null,
        ],
      );
    }

    await execute(
      `UPDATE appointments
       SET complaint = $2, insured = COALESCE($3, insured), exam_fee = COALESCE($4, exam_fee)
       WHERE id = $1`,
      [id, complaint ?? null, insured ?? null, exam_fee ?? null],
    );

    return apiResponse({ saved: items.length });
  } catch (err) {
    return apiInternalError(err);
  }
});
