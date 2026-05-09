import 'dotenv/config';
import { pool } from './client';

const employees = [
  // Real doctors
  { last_name: 'Сонин', first_name: 'Батсанаа', registry_number: 'УБ90041512', email: 'batsanaa@sayandent.mn', role: 'doctor', phone: '99001122', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо' },
  { last_name: 'Онон', first_name: 'Эрдэнэбат', registry_number: 'УБ85072201', email: 'erdenebat@sayandent.mn', role: 'doctor', phone: '88112233', branch: 'Баянгол салбар', address: 'УБ, Сүхбаатар дүүрэг, 1-р хороо' },
  { last_name: 'Ганбаатар', first_name: 'Эрдэнэзориг', registry_number: 'УБ92110305', email: 'erdenezorig@sayandent.mn', role: 'doctor', phone: '95223344', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 11-р хороо' },
  { last_name: 'Ганбаяр', first_name: 'Хонгорзул', registry_number: 'ДО88060715', email: 'khongorzul@sayandent.mn', role: 'doctor', phone: '80334455', branch: 'Баянгол салбар', address: 'УБ, Баянзүрх дүүрэг, 5-р хороо' },
  { last_name: 'Ганболд', first_name: 'Цэнгүүн', registry_number: 'УБ95031420', email: 'tsenguun@sayandent.mn', role: 'doctor', phone: '99445566', branch: 'Баянгол салбар', address: 'УБ, Чингэлтэй дүүрэг, 2-р хороо' },
  // Receptionists
  { last_name: 'Баатар', first_name: 'Дэлгэрмаа', registry_number: 'УБ91082510', email: 'delgermaa@sayandent.mn', role: 'receptionist', phone: '88556677', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 7-р хороо' },
  { last_name: 'Мөнх', first_name: 'Тэмүүжин', registry_number: 'АР00121803', email: 'temuujin@sayandent.mn', role: 'receptionist', phone: '95667788', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 3-р хороо' },
  { last_name: 'Нямдорж', first_name: 'Золзаяа', registry_number: 'УБ93050112', email: 'zolzaya@sayandent.mn', role: 'receptionist', phone: '80778899', branch: 'Баянгол салбар', address: 'УБ, Сонгинохайрхан дүүрэг, 9-р хороо' },
  // Admin
  { last_name: 'Цэрэн', first_name: 'Батжаргал', registry_number: 'УБ87091425', email: 'batjargal@sayandent.mn', role: 'admin', phone: '99889900', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо' },
  { last_name: 'Отгон', first_name: 'Нарангэрэл', registry_number: 'ХО96040830', email: 'narangerel@sayandent.mn', role: 'admin', phone: '88990011', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 15-р хороо' },
];

async function seed() {
  console.log('Seeding 10 employees...');

  for (const e of employees) {
    await pool.query(
      `INSERT INTO employees (last_name, first_name, registry_number, email, role, phone, branch, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (registry_number) DO NOTHING`,
      [e.last_name, e.first_name, e.registry_number, e.email, e.role, e.phone, e.branch, e.address],
    );
  }

  console.log('Done.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
