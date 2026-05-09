import { query, queryOne } from '@/lib/db/client';
import { apiResponse, apiBadRequest, apiInternalError } from '@/lib/api/response';

const DEV_PATIENTS = [
  { id: '1', card_number: 173, last_name: 'Давагсамбуу', first_name: 'Батбаяр', date_of_birth: '1972-10-12', registry_number: 'ИА72101219', gender: 'male', phone: '95950952', has_allergy: false, patient_type: 'gold', payment_status: 'paid' },
  { id: '2', card_number: 172, last_name: 'Ганбаатар', first_name: 'Тэргэл', date_of_birth: '2010-02-14', registry_number: 'УЦ10221420', gender: 'female', phone: '88166161, 80327762', has_allergy: false, patient_type: 'regular', payment_status: 'unpaid' },
  { id: '3', card_number: 171, last_name: 'Мягмарбаатар', first_name: 'Энжин', date_of_birth: '2010-05-19', registry_number: 'АЮ10251989', gender: 'female', phone: '95766123, 88072704', has_allergy: false, patient_type: 'silver', payment_status: 'paid' },
  { id: '4', card_number: 170, last_name: 'Батсайхан', first_name: 'Баярбат', date_of_birth: '1990-05-30', registry_number: 'ЕЙ90053012', gender: 'male', phone: '89399099', has_allergy: false, patient_type: 'regular', payment_status: 'paid' },
  { id: '5', card_number: 169, last_name: 'Тулга', first_name: 'Энхжин', date_of_birth: '2021-11-23', registry_number: 'УА21312386', gender: 'female', phone: '99038346', has_allergy: false, patient_type: 'bronze', payment_status: 'unpaid' },
  { id: '6', card_number: 168, last_name: 'Доед', first_name: 'Дашгэрэл', date_of_birth: '1956-04-09', registry_number: 'ЧП56040904', gender: 'male', phone: '86085474', has_allergy: true, patient_type: 'gold', payment_status: 'paid' },
  { id: '7', card_number: 167, last_name: 'Рэнцэндорж', first_name: 'Гансүх', date_of_birth: '1977-06-10', registry_number: 'БС77061032', gender: 'male', phone: '98100999', has_allergy: false, patient_type: 'regular', payment_status: 'unpaid' },
  { id: '8', card_number: 166, last_name: 'Дэлэг', first_name: 'Мөнхбаатар', date_of_birth: '1977-01-31', registry_number: 'ЧА77013177', gender: 'male', phone: '88113428, 99104209', has_allergy: false, patient_type: 'silver', payment_status: 'paid' },
  { id: '9', card_number: 165, last_name: 'Ч', first_name: 'Долзодмаа', date_of_birth: '1988-09-21', registry_number: 'УН88092121', gender: 'male', phone: '95890920', has_allergy: true, patient_type: 'bronze', payment_status: 'unpaid' },
  { id: '10', card_number: 164, last_name: 'Болормаа', first_name: 'Сарантуяа', date_of_birth: '1980-03-15', registry_number: 'ЛЮ80031529', gender: 'female', phone: '99039209', has_allergy: false, patient_type: 'regular', payment_status: 'paid' },
];

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, card_number, last_name, first_name, date_of_birth, registry_number, gender, phone, has_allergy, patient_type, payment_status
       FROM patients
       WHERE deleted_at IS NULL
       ORDER BY card_number DESC`,
    );
    return apiResponse(rows);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      return apiResponse(DEV_PATIENTS);
    }
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { last_name, first_name, phone } = body;
    if (!last_name || !first_name || !phone) {
      return apiBadRequest('Овог, нэр, утас заавал шаардлагатай');
    }

    const row = await queryOne(
      `INSERT INTO patients (last_name, first_name, registry_number, date_of_birth, gender, phone, phone2, province, district, address, email, patient_type, form_number, has_allergy, allergies)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        last_name,
        first_name,
        body.registry_number || null,
        body.date_of_birth || null,
        body.gender || null,
        phone,
        body.phone2 || null,
        body.province || null,
        body.district || null,
        body.address || null,
        body.email || null,
        body.patient_type || 'regular',
        body.form_number || null,
        body.has_allergy ?? false,
        body.allergies || null,
      ],
    );

    return apiResponse(row, 201);
  } catch (err) {
    return apiInternalError(err);
  }
}
