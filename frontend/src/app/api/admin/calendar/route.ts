import { query } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { apiResponse, apiBadRequest, apiInternalError } from '@/lib/api/response';

// ── Dev fixtures: this-week-only realistic schedule ──
const DOCTORS = [
  { id: '1', name: 'Сонин Батсанаа' },
  { id: '2', name: 'Онон Эрдэнэбат' },
  { id: '3', name: 'Ганбаатар Эрдэнэзориг' },
  { id: '4', name: 'Ганбаяр Хонгорзул' },
  { id: '5', name: 'Ганболд Цэнгүүн' },
];

const PATIENTS = [
  { name: 'Давагсамбуу Батбаяр',      phone: '95950952',        email: null },
  { name: 'Ганбаатар Тэргэл',          phone: '88166161',        email: null },
  { name: 'Мягмарбаатар Энжин',        phone: '95766123',        email: null },
  { name: 'Батсайхан Баярбат',         phone: '89399099',        email: null },
  { name: 'Тулга Энхжин',              phone: '99038346',        email: null },
  { name: 'Доед Дашгэрэл',             phone: '86085474',        email: null },
  { name: 'Рэнцэндорж Гансүх',         phone: '98100999',        email: null },
  { name: 'Дэлэг Мөнхбаатар',          phone: '88113428',        email: null },
  { name: 'Ч Долзодмаа',               phone: '95890920',        email: null },
  { name: 'Болормаа Сарантуяа',        phone: '99039209',        email: null },
];

// Per-weekday templates (Mon=1..Sun=0). Each entry: [hour, minute, durationMin, doctorIdx, patientIdx, serviceIdx]
type Slot = [number, number, number, number, number, number];
const WEEK_TEMPLATE: Record<number, Slot[]> = {
  1: [ // Monday — busy start of week
    [9, 0, 60, 0, 0, 0],   [9, 30, 45, 1, 1, 1],  [10, 0, 30, 2, 2, 7],
    [10, 30, 90, 0, 3, 3], [11, 0, 60, 3, 4, 5],  [11, 15, 45, 1, 5, 6],
    [13, 0, 60, 2, 6, 0],  [14, 0, 90, 0, 7, 3],  [14, 30, 45, 4, 8, 1],
    [15, 30, 60, 1, 9, 2], [16, 0, 30, 3, 0, 7],  [16, 30, 45, 2, 1, 5],
  ],
  2: [ // Tuesday
    [9, 0, 45, 1, 2, 1],   [9, 30, 30, 3, 3, 7],  [10, 0, 60, 0, 4, 4],
    [10, 30, 60, 4, 5, 0], [11, 30, 45, 2, 6, 6], [12, 0, 60, 1, 7, 5],
    [14, 0, 90, 0, 8, 3],  [14, 30, 60, 3, 9, 2], [15, 30, 45, 4, 0, 1],
    [16, 30, 30, 2, 1, 0],
  ],
  3: [ // Wednesday — afternoon block (lunch-ish on doctor 0)
    [9, 0, 30, 0, 2, 0],   [9, 30, 60, 1, 3, 5],  [10, 0, 45, 2, 4, 1],
    [10, 30, 60, 3, 5, 4], [11, 0, 90, 4, 6, 3],  [12, 0, 30, 1, 7, 7],
    [14, 0, 45, 2, 0, 6],  [15, 0, 60, 3, 1, 2],  [16, 0, 45, 4, 8, 1],
    [17, 0, 30, 1, 9, 0],
  ],
  4: [ // Thursday
    [9, 0, 60, 0, 4, 5],   [9, 30, 45, 2, 5, 1],  [10, 0, 30, 4, 6, 0],
    [10, 30, 90, 1, 7, 3], [11, 30, 60, 0, 8, 4], [13, 30, 45, 3, 9, 6],
    [14, 0, 60, 2, 0, 2],  [15, 0, 45, 1, 1, 1],  [15, 30, 30, 4, 2, 7],
    [16, 0, 60, 3, 3, 5],  [16, 30, 45, 0, 4, 0],
  ],
  5: [ // Friday — busy end-of-week
    [9, 0, 30, 0, 5, 0],   [9, 30, 60, 1, 6, 5],  [10, 0, 45, 2, 7, 1],
    [10, 30, 60, 3, 8, 4], [11, 0, 90, 4, 9, 3],  [11, 30, 30, 0, 0, 7],
    [13, 0, 60, 1, 1, 2],  [13, 30, 45, 2, 2, 6], [14, 30, 60, 3, 3, 5],
    [15, 0, 45, 4, 4, 1],  [15, 30, 90, 0, 5, 3], [16, 30, 30, 1, 6, 0],
    [17, 0, 45, 2, 7, 7],
  ],
  6: [ // Saturday — lighter
    [10, 0, 60, 0, 8, 5],  [10, 30, 45, 1, 9, 1], [11, 30, 60, 2, 0, 4],
    [12, 0, 30, 3, 1, 0],  [13, 0, 45, 0, 2, 6],  [14, 0, 60, 1, 3, 2],
  ],
  // Sunday: closed
};

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun
  const diff = (dow + 6) % 7; // shift so Mon=0
  x.setDate(x.getDate() - diff);
  return x;
}

function generateDevCalendarData(from: Date, to: Date) {
  const services = ['Шүд цэвэрлэгээ', 'Ломбо тавих', 'Шүд цайруулга', 'Имплант', 'Ортодонт', 'Суваг эмчилгээ', 'Титэм', 'Шүд авах'];
  const sources = ['online', 'manual'] as const;
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // exclusive

  const appointments: Record<string, unknown>[] = [];
  const blocks: Record<string, unknown>[] = [];
  let id = 1;

  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  while (day < to) {
    const inThisWeek = day >= weekStart && day < weekEnd;
    if (inThisWeek) {
      const dow = day.getDay();
      const slots = WEEK_TEMPLATE[dow] || [];
      for (let i = 0; i < slots.length; i++) {
        const [h, m, dur, docIdx, patIdx, svcIdx] = slots[i];
        const scheduled = new Date(day);
        scheduled.setHours(h, m, 0, 0);

        // Status: past slots get varied finished states, future stays booked
        let status: string;
        if (scheduled < now) {
          const r = (id * 13) % 10;
          status = r < 6 ? 'paid' : r < 8 ? 'examined' : r < 9 ? 'arrived' : 'cancelled_by_patient';
        } else {
          status = (id * 7) % 5 === 0 ? 'arrived' : 'booked';
        }

        const patient = PATIENTS[patIdx];
        const doctor = DOCTORS[docIdx];

        appointments.push({
          id: String(id++),
          full_name: patient.name,
          phone: patient.phone,
          email: patient.email,
          service_type: services[svcIdx],
          notes: null,
          status,
          source: sources[i % 2],
          scheduled_at: scheduled.toISOString(),
          duration_minutes: dur,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
        });
      }

      // Doctor unavailable block: Wednesday 13:00–15:00 for doctor 0
      if (dow === 3) {
        const start = new Date(day); start.setHours(13, 0, 0, 0);
        const end = new Date(day);   end.setHours(15, 0, 0, 0);
        blocks.push({
          id: `block-${id++}`,
          doctor_id: DOCTORS[0].id,
          doctor_name: DOCTORS[0].name,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          reason: 'Хувийн цаг',
        });
      }
    }
    day.setDate(day.getDate() + 1);
  }

  return { appointments, blocks };
}

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return apiBadRequest('from and to query params are required (ISO timestamps)');
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
      return apiBadRequest('Invalid from/to range');
    }

    let appointments, blocks;
    try {
      [appointments, blocks] = await Promise.all([
        query(
          `SELECT a.id, a.full_name, a.phone, a.email, a.service_type, a.notes,
                  a.status, a.source, a.scheduled_at, a.duration_minutes,
                  a.doctor_id, st.name AS doctor_name
           FROM appointments a
           LEFT JOIN staff_translations st ON st.staff_id = a.doctor_id AND st.locale = 'mn'
           WHERE a.deleted_at IS NULL
             AND a.scheduled_at IS NOT NULL
             AND a.scheduled_at >= $1::timestamptz
             AND a.scheduled_at < $2::timestamptz
           ORDER BY a.scheduled_at ASC`,
          [fromDate.toISOString(), toDate.toISOString()]
        ),
        query(
          `SELECT b.id, b.doctor_id, b.starts_at, b.ends_at, b.reason,
                  st.name AS doctor_name
           FROM doctor_unavailable_blocks b
           LEFT JOIN staff_translations st ON st.staff_id = b.doctor_id AND st.locale = 'mn'
           WHERE b.deleted_at IS NULL
             AND b.starts_at < $2::timestamptz
             AND b.ends_at > $1::timestamptz
           ORDER BY b.starts_at ASC`,
          [fromDate.toISOString(), toDate.toISOString()]
        ),
      ]);
    } catch {
      // Dev fallback when DB tables don't exist yet
      if (process.env.NODE_ENV !== 'production') {
        const dev = generateDevCalendarData(fromDate, toDate);
        return apiResponse(dev);
      }
      throw new Error('Database query failed');
    }

    // Dev fallback when DB returns no rows so the calendar isn't empty in development
    if (
      process.env.NODE_ENV !== 'production' &&
      appointments.length === 0 &&
      blocks.length === 0
    ) {
      const dev = generateDevCalendarData(fromDate, toDate);
      return apiResponse(dev);
    }

    return apiResponse({ appointments, blocks });
  } catch (err) {
    return apiInternalError(err);
  }
});
