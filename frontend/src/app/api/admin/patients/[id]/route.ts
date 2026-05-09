import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/client';
import { apiResponse, apiNotFound, apiInternalError } from '@/lib/api/response';

type Ctx = { params: Promise<{ id: string }> };

const DEV_PATIENTS: Record<string, Record<string, unknown>> = {
  '1':  { id: '1',  card_number: 173, last_name: 'Давагсамбуу',  first_name: 'Батбаяр',    date_of_birth: '1972-10-12', registry_number: 'ИА72101219', gender: 'male',   phone: '95950952', phone2: null, province: 'Улаанбаатар', district: 'Батцэнгэл', address: null, email: null, has_allergy: false, allergies: null, patient_type: 'gold',    payment_status: 'paid' },
  '2':  { id: '2',  card_number: 172, last_name: 'Ганбаатар',     first_name: 'Тэргэл',     date_of_birth: '2010-02-14', registry_number: 'УЦ10221420', gender: 'female', phone: '88166161, 80327762', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'regular', payment_status: 'unpaid' },
  '3':  { id: '3',  card_number: 171, last_name: 'Мягмарбаатар',  first_name: 'Энжин',      date_of_birth: '2010-05-19', registry_number: 'АЮ10251989', gender: 'female', phone: '95766123, 88072704', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'silver',  payment_status: 'paid' },
  '4':  { id: '4',  card_number: 170, last_name: 'Батсайхан',     first_name: 'Баярбат',    date_of_birth: '1990-05-30', registry_number: 'ЕЙ90053012', gender: 'male',   phone: '89399099', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'regular', payment_status: 'paid' },
  '5':  { id: '5',  card_number: 169, last_name: 'Тулга',         first_name: 'Энхжин',     date_of_birth: '2021-11-23', registry_number: 'УА21312386', gender: 'female', phone: '99038346', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'bronze',  payment_status: 'unpaid' },
  '6':  { id: '6',  card_number: 168, last_name: 'Доед',          first_name: 'Дашгэрэл',   date_of_birth: '1956-04-09', registry_number: 'ЧП56040904', gender: 'male',   phone: '86085474', phone2: null, province: null, district: null, address: null, email: null, has_allergy: true,  allergies: 'Пенициллин', patient_type: 'gold',    payment_status: 'paid' },
  '7':  { id: '7',  card_number: 167, last_name: 'Рэнцэндорж',    first_name: 'Гансүх',     date_of_birth: '1977-06-10', registry_number: 'БС77061032', gender: 'male',   phone: '98100999', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'regular', payment_status: 'unpaid' },
  '8':  { id: '8',  card_number: 166, last_name: 'Дэлэг',         first_name: 'Мөнхбаатар', date_of_birth: '1977-01-31', registry_number: 'ЧА77013177', gender: 'male',   phone: '88113428, 99104209', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'silver',  payment_status: 'paid' },
  '9':  { id: '9',  card_number: 165, last_name: 'Ч',             first_name: 'Долзодмаа',  date_of_birth: '1988-09-21', registry_number: 'УН88092121', gender: 'male',   phone: '95890920', phone2: null, province: null, district: null, address: null, email: null, has_allergy: true,  allergies: 'Латекс', patient_type: 'bronze',  payment_status: 'unpaid' },
  '10': { id: '10', card_number: 164, last_name: 'Болормаа',      first_name: 'Сарантуяа',  date_of_birth: '1980-03-15', registry_number: 'ЛЮ80031529', gender: 'female', phone: '99039209', phone2: null, province: null, district: null, address: null, email: null, has_allergy: false, allergies: null, patient_type: 'regular', payment_status: 'paid' },
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const row = await queryOne(
      `SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!row) {
      if (process.env.NODE_ENV !== 'production' && DEV_PATIENTS[id]) {
        return apiResponse(DEV_PATIENTS[id]);
      }
      return apiNotFound('Patient not found');
    }
    return apiResponse(row);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' && DEV_PATIENTS[id]) {
      return apiResponse(DEV_PATIENTS[id]);
    }
    return apiInternalError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const allowed = [
      'last_name', 'first_name', 'registry_number', 'date_of_birth', 'gender',
      'phone', 'phone2', 'province', 'district', 'address', 'email',
      'patient_type', 'payment_status', 'form_number', 'has_allergy', 'allergies',
    ];

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    for (const key of allowed) {
      if (key in body) {
        sets.push(`${key} = $${i++}`);
        vals.push(body[key] === '' ? null : body[key]);
      }
    }

    if (sets.length === 0) return apiResponse({ message: 'Nothing to update' });

    vals.push(id);
    const count = await execute(
      `UPDATE patients SET ${sets.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
      vals,
    );

    if (count === 0) return apiNotFound('Patient not found');

    const updated = await queryOne(`SELECT * FROM patients WHERE id = $1`, [id]);
    return apiResponse(updated);
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const count = await execute(
      `UPDATE patients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (count === 0) return apiNotFound('Patient not found');
    return apiResponse({ message: 'Deleted' });
  } catch (err) {
    return apiInternalError(err);
  }
}
