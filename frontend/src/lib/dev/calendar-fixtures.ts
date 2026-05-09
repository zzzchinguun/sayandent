// Dev-only fixtures so the calendar list API and the appointment detail API
// share the same deterministic data when no DB rows exist.

export const DEV_DOCTORS = [
  { id: '1', name: 'Сонин Батсанаа' },
  { id: '2', name: 'Онон Эрдэнэбат' },
  { id: '3', name: 'Ганбаатар Эрдэнэзориг' },
  { id: '4', name: 'Ганбаяр Хонгорзул' },
  { id: '5', name: 'Ганболд Цэнгүүн' },
];

export const DEV_PATIENTS = [
  { name: 'Давагсамбуу Батбаяр',  phone: '95950952', email: null, card_number: 173, patient_type: 'gold' },
  { name: 'Ганбаатар Тэргэл',      phone: '88166161', email: null, card_number: 172, patient_type: 'regular' },
  { name: 'Мягмарбаатар Энжин',    phone: '95766123', email: null, card_number: 171, patient_type: 'silver' },
  { name: 'Батсайхан Баярбат',     phone: '89399099', email: null, card_number: 170, patient_type: 'regular' },
  { name: 'Тулга Энхжин',          phone: '99038346', email: null, card_number: 169, patient_type: 'bronze' },
  { name: 'Доед Дашгэрэл',         phone: '86085474', email: null, card_number: 168, patient_type: 'gold' },
  { name: 'Рэнцэндорж Гансүх',     phone: '98100999', email: null, card_number: 167, patient_type: 'regular' },
  { name: 'Дэлэг Мөнхбаатар',      phone: '88113428', email: null, card_number: 166, patient_type: 'silver' },
  { name: 'Ч Долзодмаа',           phone: '95890920', email: null, card_number: 165, patient_type: 'bronze' },
  { name: 'Болормаа Сарантуяа',    phone: '99039209', email: null, card_number: 164, patient_type: 'regular' },
];

export const DEV_SERVICES = [
  'Шүд цэвэрлэгээ', 'Ломбо тавих', 'Шүд цайруулга', 'Имплант',
  'Ортодонт', 'Суваг эмчилгээ', 'Титэм', 'Шүд авах',
];

// [hour, minute, durationMin, doctorIdx, patientIdx, serviceIdx]
export type WeeklySlot = [number, number, number, number, number, number];
export const WEEK_TEMPLATE: Record<number, WeeklySlot[]> = {
  1: [
    [9, 0, 60, 0, 0, 0],   [9, 30, 45, 1, 1, 1],  [10, 0, 30, 2, 2, 7],
    [10, 30, 90, 0, 3, 3], [11, 0, 60, 3, 4, 5],  [11, 15, 45, 1, 5, 6],
    [13, 0, 60, 2, 6, 0],  [14, 0, 90, 0, 7, 3],  [14, 30, 45, 4, 8, 1],
    [15, 30, 60, 1, 9, 2], [16, 0, 30, 3, 0, 7],  [16, 30, 45, 2, 1, 5],
  ],
  2: [
    [9, 0, 45, 1, 2, 1],   [9, 30, 30, 3, 3, 7],  [10, 0, 60, 0, 4, 4],
    [10, 30, 60, 4, 5, 0], [11, 30, 45, 2, 6, 6], [12, 0, 60, 1, 7, 5],
    [14, 0, 90, 0, 8, 3],  [14, 30, 60, 3, 9, 2], [15, 30, 45, 4, 0, 1],
    [16, 30, 30, 2, 1, 0],
  ],
  3: [
    [9, 0, 30, 0, 2, 0],   [9, 30, 60, 1, 3, 5],  [10, 0, 45, 2, 4, 1],
    [10, 30, 60, 3, 5, 4], [11, 0, 90, 4, 6, 3],  [12, 0, 30, 1, 7, 7],
    [14, 0, 45, 2, 0, 6],  [15, 0, 60, 3, 1, 2],  [16, 0, 45, 4, 8, 1],
    [17, 0, 30, 1, 9, 0],
  ],
  4: [
    [9, 0, 60, 0, 4, 5],   [9, 30, 45, 2, 5, 1],  [10, 0, 30, 4, 6, 0],
    [10, 30, 90, 1, 7, 3], [11, 30, 60, 0, 8, 4], [13, 30, 45, 3, 9, 6],
    [14, 0, 60, 2, 0, 2],  [15, 0, 45, 1, 1, 1],  [15, 30, 30, 4, 2, 7],
    [16, 0, 60, 3, 3, 5],  [16, 30, 45, 0, 4, 0],
  ],
  5: [
    [9, 0, 30, 0, 5, 0],   [9, 30, 60, 1, 6, 5],  [10, 0, 45, 2, 7, 1],
    [10, 30, 60, 3, 8, 4], [11, 0, 90, 4, 9, 3],  [11, 30, 30, 0, 0, 7],
    [13, 0, 60, 1, 1, 2],  [13, 30, 45, 2, 2, 6], [14, 30, 60, 3, 3, 5],
    [15, 0, 45, 4, 4, 1],  [15, 30, 90, 0, 5, 3], [16, 30, 30, 1, 6, 0],
    [17, 0, 45, 2, 7, 7],
  ],
  6: [
    [10, 0, 60, 0, 8, 5],  [10, 30, 45, 1, 9, 1], [11, 30, 60, 2, 0, 4],
    [12, 0, 30, 3, 1, 0],  [13, 0, 45, 0, 2, 6],  [14, 0, 60, 1, 3, 2],
  ],
};

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = (dow + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

/**
 * Walk the current Mon–Sun week using the same id sequence as the calendar
 * route (appointments first per day, then a Wednesday block) and return the
 * appointment with the matching numeric id, or null.
 */
export function findDevAppointmentById(targetId: string): Record<string, unknown> | null {
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let id = 1;
  const day = new Date(weekStart);
  while (day < weekEnd) {
    const dow = day.getDay();
    const slots = WEEK_TEMPLATE[dow] || [];
    for (let i = 0; i < slots.length; i++) {
      const [h, m, dur, docIdx, patIdx, svcIdx] = slots[i];
      const scheduled = new Date(day);
      scheduled.setHours(h, m, 0, 0);

      const currentId = String(id++);
      if (currentId === targetId) {
        let status: string;
        if (scheduled < now) {
          const r = (Number(currentId) * 13) % 10;
          status = r < 6 ? 'paid' : r < 8 ? 'examined' : r < 9 ? 'arrived' : 'cancelled_by_patient';
        } else {
          status = (Number(currentId) * 7) % 5 === 0 ? 'arrived' : 'booked';
        }
        const patient = DEV_PATIENTS[patIdx];
        const doctor = DEV_DOCTORS[docIdx];
        const end = new Date(scheduled.getTime() + dur * 60 * 1000);
        return {
          id: currentId,
          patient_id: String(patIdx + 1),
          full_name: patient.name,
          phone: patient.phone,
          email: patient.email,
          card_number: patient.card_number,
          patient_type: patient.patient_type,
          service_type: DEV_SERVICES[svcIdx],
          notes: null,
          status,
          source: i % 2 === 0 ? 'online' : 'manual',
          scheduled_at: scheduled.toISOString(),
          ends_at: end.toISOString(),
          duration_minutes: dur,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          branch: 'Төв салбар',
          order_diagnosis: 'Анхан үзлэг',
          visit_type: 'first',
        };
      }
    }
    // Wednesday block consumes one id (matches the calendar list generator)
    if (dow === 3) id++;
    day.setDate(day.getDate() + 1);
  }
  return null;
}
