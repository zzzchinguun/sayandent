// Dev-only mutable employee list used as a fallback when the DB has no
// `employees` table yet. Lives on globalThis so HMR doesn't reset state.

export interface DevEmployee {
  id: string;
  last_name: string;
  first_name: string;
  registry_number: string | null;
  email: string | null;
  role: string;
  phone: string | null;
  branch: string | null;
  address: string | null;
  is_active: boolean;
  created_at?: string;
}

const SEED: DevEmployee[] = [
  { id: '1',  last_name: 'Сонин',      first_name: 'Батсанаа',   registry_number: 'УБ90041512', email: 'batsanaa@sayandent.mn',    role: 'doctor',       phone: '99001122', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо',          is_active: true },
  { id: '2',  last_name: 'Онон',       first_name: 'Эрдэнэбат',  registry_number: 'УБ85072201', email: 'erdenebat@sayandent.mn',   role: 'doctor',       phone: '88112233', branch: 'Баянгол салбар', address: 'УБ, Сүхбаатар дүүрэг, 1-р хороо',        is_active: true },
  { id: '3',  last_name: 'Ганбаатар',  first_name: 'Эрдэнэзориг',registry_number: 'УБ92110305', email: 'erdenezorig@sayandent.mn', role: 'doctor',       phone: '95223344', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 11-р хороо',         is_active: true },
  { id: '4',  last_name: 'Ганбаяр',    first_name: 'Хонгорзул',  registry_number: 'ДО88060715', email: 'khongorzul@sayandent.mn',  role: 'doctor',       phone: '80334455', branch: 'Баянгол салбар', address: 'УБ, Баянзүрх дүүрэг, 5-р хороо',         is_active: true },
  { id: '5',  last_name: 'Ганболд',    first_name: 'Цэнгүүн',    registry_number: 'УБ95031420', email: 'tsenguun@sayandent.mn',    role: 'doctor',       phone: '99445566', branch: 'Баянгол салбар', address: 'УБ, Чингэлтэй дүүрэг, 2-р хороо',        is_active: true },
  { id: '6',  last_name: 'Баатар',     first_name: 'Дэлгэрмаа',  registry_number: 'УБ91082510', email: 'delgermaa@sayandent.mn',   role: 'receptionist', phone: '88556677', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 7-р хороо',          is_active: true },
  { id: '7',  last_name: 'Мөнх',       first_name: 'Тэмүүжин',   registry_number: 'АР00121803', email: 'temuujin@sayandent.mn',    role: 'receptionist', phone: '95667788', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 3-р хороо',          is_active: true },
  { id: '8',  last_name: 'Нямдорж',    first_name: 'Золзаяа',    registry_number: 'УБ93050112', email: 'zolzaya@sayandent.mn',     role: 'receptionist', phone: '80778899', branch: 'Баянгол салбар', address: 'УБ, Сонгинохайрхан дүүрэг, 9-р хороо',   is_active: false },
  { id: '9',  last_name: 'Цэрэн',      first_name: 'Батжаргал',  registry_number: 'УБ87091425', email: 'batjargal@sayandent.mn',   role: 'admin',        phone: '99889900', branch: 'Баянгол салбар', address: 'УБ, Баянгол дүүрэг, 3-р хороо',          is_active: true },
  { id: '10', last_name: 'Отгон',      first_name: 'Нарангэрэл', registry_number: 'ХО96040830', email: 'narangerel@sayandent.mn',  role: 'admin',        phone: '88990011', branch: 'Баянгол салбар', address: 'УБ, Хан-Уул дүүрэг, 15-р хороо',         is_active: true },
];

declare global {
  // eslint-disable-next-line no-var
  var __employees_dev_store: DevEmployee[] | undefined;
}

const list: DevEmployee[] =
  globalThis.__employees_dev_store ??
  (globalThis.__employees_dev_store = SEED.map((e) => ({ ...e })));

export const employeesDev = {
  list(): DevEmployee[] {
    return [...list];
  },
  has(id: string): boolean {
    return list.some((e) => e.id === id);
  },
  remove(id: string): boolean {
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  },
  update(id: string, patch: Partial<DevEmployee>): DevEmployee | null {
    const it = list.find((e) => e.id === id);
    if (!it) return null;
    Object.assign(it, patch);
    return it;
  },
};
