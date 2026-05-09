import { query } from '@/lib/db/client';
import { apiResponse, apiInternalError } from '@/lib/api/response';
import { employeesDev } from './_devStore';

// Legacy local copy preserved for reference; the actual mutable list lives in
// `_devStore.ts` so deletes/updates persist across requests in dev.
const DEV_EMPLOYEES = [
  { id: '1', last_name: 'Сонин', first_name: 'Батсанаа', registry_number: 'УБ90041512', email: 'batsanaa@sayandent.mn', role: 'doctor', phone: '99001122', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо', is_active: true },
  { id: '2', last_name: 'Онон', first_name: 'Эрдэнэбат', registry_number: 'УБ85072201', email: 'erdenebat@sayandent.mn', role: 'doctor', phone: '88112233', branch: 'Баянгол салбар', address: 'УБ, Сүхбаатар дүүрэг, 1-р хороо', is_active: true },
  { id: '3', last_name: 'Ганбаатар', first_name: 'Эрдэнэзориг', registry_number: 'УБ92110305', email: 'erdenezorig@sayandent.mn', role: 'doctor', phone: '95223344', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 11-р хороо', is_active: true },
  { id: '4', last_name: 'Ганбаяр', first_name: 'Хонгорзул', registry_number: 'ДО88060715', email: 'khongorzul@sayandent.mn', role: 'doctor', phone: '80334455', branch: 'Баянгол салбар', address: 'УБ, Баянзүрх дүүрэг, 5-р хороо', is_active: true },
  { id: '5', last_name: 'Ганболд', first_name: 'Цэнгүүн', registry_number: 'УБ95031420', email: 'tsenguun@sayandent.mn', role: 'doctor', phone: '99445566', branch: 'Баянгол салбар', address: 'УБ, Чингэлтэй дүүрэг, 2-р хороо', is_active: true },
  { id: '6', last_name: 'Баатар', first_name: 'Дэлгэрмаа', registry_number: 'УБ91082510', email: 'delgermaa@sayandent.mn', role: 'receptionist', phone: '88556677', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 7-р хороо', is_active: true },
  { id: '7', last_name: 'Мөнх', first_name: 'Тэмүүжин', registry_number: 'АР00121803', email: 'temuujin@sayandent.mn', role: 'receptionist', phone: '95667788', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 3-р хороо', is_active: true },
  { id: '8', last_name: 'Нямдорж', first_name: 'Золзаяа', registry_number: 'УБ93050112', email: 'zolzaya@sayandent.mn', role: 'receptionist', phone: '80778899', branch: 'Баянгол салбар', address: 'УБ, Сонгинохайрхан дүүрэг, 9-р хороо', is_active: false },
  { id: '9', last_name: 'Цэрэн', first_name: 'Батжаргал', registry_number: 'УБ87091425', email: 'batjargal@sayandent.mn', role: 'admin', phone: '99889900', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо', is_active: true },
  { id: '10', last_name: 'Отгон', first_name: 'Нарангэрэл', registry_number: 'ХО96040830', email: 'narangerel@sayandent.mn', role: 'admin', phone: '88990011', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 15-р хороо', is_active: true },
];

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, last_name, first_name, registry_number, email, role, phone, branch, address, is_active, created_at
       FROM employees
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`,
    );
    return apiResponse(rows);
  } catch (err) {
    // Dev fallback: return mock data when employees table doesn't exist yet.
    // Use the shared in-memory store so deletes from /api/admin/staff/[id]
    // and updates from /api/admin/employees/[id] are reflected here.
    if (process.env.NODE_ENV !== 'production') {
      return apiResponse(employeesDev.list());
    }
    return apiInternalError(err);
  }
}

// Reference the seed array so the unused-var lint stays quiet — values are
// kept identical to `_devStore` initial seed.
void DEV_EMPLOYEES;
