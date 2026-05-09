import 'dotenv/config';
import { pool } from './client';

const patients = [
  { last_name: 'Давагсамбуу', first_name: 'Батбаяр', date_of_birth: '1972-10-12', registry_number: 'ИА72101219', gender: 'male', phone: '95950952', has_allergy: false, patient_type: 'gold', payment_status: 'paid' },
  { last_name: 'Ганбаатар', first_name: 'Тэргэл', date_of_birth: '2010-02-14', registry_number: 'УЦ10221420', gender: 'female', phone: '88166161, 80327762', has_allergy: false, patient_type: 'regular', payment_status: 'unpaid' },
  { last_name: 'Мягмарбаатар', first_name: 'Энжин', date_of_birth: '2010-05-19', registry_number: 'АЮ10251989', gender: 'female', phone: '95766123, 88072704', has_allergy: false, patient_type: 'silver', payment_status: 'paid' },
  { last_name: 'Батсайхан', first_name: 'Баярбат', date_of_birth: '1990-05-30', registry_number: 'ЕЙ90053012', gender: 'male', phone: '89399099', has_allergy: false, patient_type: 'regular', payment_status: 'paid' },
  { last_name: 'Тулга', first_name: 'Энхжин', date_of_birth: '2021-11-23', registry_number: 'УА21312386', gender: 'female', phone: '99038346', has_allergy: false, patient_type: 'bronze', payment_status: 'unpaid' },
  { last_name: 'Доед', first_name: 'Дашгэрэл', date_of_birth: '1956-04-09', registry_number: 'ЧП56040904', gender: 'male', phone: '86085474', has_allergy: true, allergies: 'Пенициллин', patient_type: 'gold', payment_status: 'paid' },
  { last_name: 'Рэнцэндорж', first_name: 'Гансүх', date_of_birth: '1977-06-10', registry_number: 'БС77061032', gender: 'male', phone: '98100999', has_allergy: false, patient_type: 'regular', payment_status: 'unpaid' },
  { last_name: 'Дэлэг', first_name: 'Мөнхбаатар', date_of_birth: '1977-01-31', registry_number: 'ЧА77013177', gender: 'male', phone: '88113428, 99104209', has_allergy: false, patient_type: 'silver', payment_status: 'paid' },
  { last_name: 'Ч', first_name: 'Долзодмаа', date_of_birth: '1988-09-21', registry_number: 'УН88092121', gender: 'male', phone: '95890920', has_allergy: true, allergies: 'Латекс', patient_type: 'bronze', payment_status: 'unpaid' },
  { last_name: 'Болормаа', first_name: 'Сарантуяа', date_of_birth: '1980-03-15', registry_number: 'ЛЮ80031529', gender: 'female', phone: '99039209', has_allergy: false, patient_type: 'regular', payment_status: 'paid' },
];

async function seed() {
  console.log('Seeding 10 patients...');

  for (const p of patients) {
    await pool.query(
      `INSERT INTO patients (last_name, first_name, date_of_birth, registry_number, gender, phone, has_allergy, allergies, patient_type, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (registry_number) DO NOTHING`,
      [p.last_name, p.first_name, p.date_of_birth, p.registry_number, p.gender, p.phone, p.has_allergy, (p as Record<string, unknown>).allergies ?? null, p.patient_type, p.payment_status],
    );
  }

  console.log('Done.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
