'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Shared "currently lifted" event id — the last-hovered block stays on top
// until another block is hovered.
const ActiveEventCtx = createContext<{
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}>({ activeId: null, setActiveId: () => {} });

// ──────────────────────────────────────────────────────────────────────────
// Status meta — keys combine (status, source) so manual vs online booked
// render as distinct legend entries, per design.
// ──────────────────────────────────────────────────────────────────────────

type AppointmentStatus =
  | 'booked'
  | 'arrived'
  | 'examined'
  | 'paid'
  | 'cancelled_by_patient'
  | 'cancelled_by_doctor';

type AppointmentSource = 'online' | 'manual';

type LegendKey =
  | 'booked_manual'
  | 'booked_online'
  | 'arrived'
  | 'examined'
  | 'paid'
  | 'cancelled_by_patient'
  | 'cancelled_by_doctor'
  | 'doctor_off';

interface LegendMeta {
  label: string;
  swatch: string; // tailwind bg+border for legend dot
  block: string;  // tailwind classes for calendar block
}

const LEGEND: Record<LegendKey, LegendMeta> = {
  booked_manual:        { label: 'Захиалга өгсөн',         swatch: 'bg-orange-400',  block: 'bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-950/60 dark:border-orange-700 dark:text-orange-200' },
  booked_online:        { label: 'Онлайн цаг захиалга',   swatch: 'bg-indigo-400',  block: 'bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-200' },
  arrived:              { label: 'Ирсэн',                  swatch: 'bg-sky-400',     block: 'bg-sky-100 border-sky-400 text-sky-900 dark:bg-sky-950/60 dark:border-sky-700 dark:text-sky-200' },
  examined:             { label: 'Үзлэг дууссан',          swatch: 'bg-purple-400',  block: 'bg-purple-100 border-purple-400 text-purple-900 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-200' },
  paid:                 { label: 'Төлбөр хийгдсэн',        swatch: 'bg-emerald-400', block: 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200' },
  cancelled_by_patient: { label: 'Үйлчлүүлэгч цуцласан',   swatch: 'bg-stone-400',   block: 'bg-stone-100 border-stone-400 text-stone-600 line-through dark:bg-stone-800 dark:border-stone-600 dark:text-stone-400' },
  cancelled_by_doctor:  { label: 'Эмч цуцласан',           swatch: 'bg-rose-400',    block: 'bg-rose-100 border-rose-400 text-rose-900 line-through dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200' },
  doctor_off:           { label: 'Эмчийн ажиллахгүй цаг', swatch: 'bg-slate-400',   block: 'bg-slate-200 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300' },
};

const LEGEND_ORDER: LegendKey[] = [
  'booked_manual',
  'booked_online',
  'arrived',
  'examined',
  'paid',
  'cancelled_by_patient',
  'cancelled_by_doctor',
  'doctor_off',
];

function legendKeyFor(status: AppointmentStatus, source: AppointmentSource): LegendKey {
  if (status === 'booked') return source === 'manual' ? 'booked_manual' : 'booked_online';
  return status;
}

// ──────────────────────────────────────────────────────────────────────────
// API types
// ──────────────────────────────────────────────────────────────────────────

interface ApiAppointment {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  notes: string | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  scheduled_at: string;
  duration_minutes: number;
  doctor_id: string | null;
  doctor_name: string | null;
}

interface ApiBlock {
  id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

type CalendarEvent =
  | { kind: 'appt'; id: string; start: Date; end: Date; legend: LegendKey; appt: ApiAppointment }
  | { kind: 'block'; id: string; start: Date; end: Date; legend: 'doctor_off'; block: ApiBlock };

// ──────────────────────────────────────────────────────────────────────────
// Date helpers (no library; admin only — local time semantics are fine)
// ──────────────────────────────────────────────────────────────────────────

const MS_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  return addDays(x, -x.getDay()); // Sunday-start, matching the design
}
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtMonthYear(d: Date): string {
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сар`;
}
function fmtDayLong(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAY_SHORT[d.getDay()]})`;
}
function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ISO datetime with the *local* timezone offset, e.g. "2026-05-11T13:00:00+08:00"
function fmtLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offH = pad(Math.floor(absMin / 60));
  const offM = pad(absMin % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${offH}:${offM}`;
}

// Build /admin/appointments/create with the same query-string format the user
// specified: branch_id, start_date (local ISO with TZ offset), user_id.
function buildCreateUrl(opts: { day: Date; hour: number; minute?: number; doctorId?: string | null; branchId?: string | number }): string {
  const start = new Date(opts.day);
  start.setHours(opts.hour, opts.minute ?? 0, 0, 0);
  const params = new URLSearchParams({
    branch_id: String(opts.branchId ?? 1),
    start_date: fmtLocalIso(start),
  });
  if (opts.doctorId) params.set('user_id', String(opts.doctorId));
  return `/admin/appointments/create?${params.toString()}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Lane layout: spread overlapping events across the x-axis (Apple/Google style)
// ──────────────────────────────────────────────────────────────────────────

interface LaneInfo {
  lane: number;
  lanes: number;
  /** Start time (epoch ms) of the next event in the same lane, or undefined if none — used so a block can expand vertically into empty space below it. */
  nextStartMs?: number;
}

function layoutEvents(events: CalendarEvent[]): Map<string, LaneInfo> {
  const result = new Map<string, LaneInfo>();
  if (events.length === 0) return result;

  // Sort by start asc, then by end desc (longer first → more stable lane assignment)
  const sorted = [...events].sort((a, b) => {
    const sa = a.start.getTime();
    const sb = b.start.getTime();
    if (sa !== sb) return sa - sb;
    return b.end.getTime() - a.end.getTime();
  });

  // First pass: assign each event a lane and total cluster lane count.
  const passOne = new Map<string, { lane: number; lanes: number }>();
  let cluster: { ev: CalendarEvent; lane: number }[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const lanes = Math.max(...cluster.map((c) => c.lane)) + 1;
    for (const c of cluster) passOne.set(c.ev.id, { lane: c.lane, lanes });
    cluster = [];
    clusterEnd = -Infinity;
  };

  // `laneEnds[i]` = current end-time of the rightmost event in lane i.
  let laneEnds: number[] = [];

  for (const ev of sorted) {
    const start = ev.start.getTime();
    const end = ev.end.getTime();

    if (start >= clusterEnd) {
      flush();
      laneEnds = [];
    }

    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    cluster.push({ ev, lane });
    if (end > clusterEnd) clusterEnd = end;
  }
  flush();

  // Second pass: for each event, find the next event in the same lane (across
  // all clusters) — that gives us the maximum vertical extension a block may
  // claim before colliding with its successor.
  const lanesById = new Map<string, number>();
  for (const [id, info] of passOne) lanesById.set(id, info.lane);

  const byLane = new Map<number, CalendarEvent[]>();
  for (const ev of sorted) {
    const lane = lanesById.get(ev.id) ?? 0;
    let list = byLane.get(lane);
    if (!list) { list = []; byLane.set(lane, list); }
    list.push(ev);
  }
  for (const [, list] of byLane) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  for (const [id, info] of passOne) {
    const ev = sorted.find((e) => e.id === id)!;
    const list = byLane.get(info.lane) ?? [];
    const idx = list.indexOf(ev);
    const next = idx >= 0 ? list[idx + 1] : undefined;
    result.set(id, {
      lane: info.lane,
      lanes: info.lanes,
      nextStartMs: next?.start.getTime(),
    });
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

type View = 'day' | 'week' | 'month';

const HOUR_START = 8;
const HOUR_END = 20; // exclusive
const HOUR_HEIGHT = 56; // px

// Stable epoch-based default so server and client agree on the initial render.
// The real "today" is set in a useEffect after mount.
const DEFAULT_FOCUS = new Date(2000, 0, 1);

export default function AppointmentsCalendar() {
  const [view, setView] = useState<View>('day');
  const [focus, setFocus] = useState<Date>(DEFAULT_FOCUS);
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resolve "today" only after hydration.
  useEffect(() => {
    setFocus(startOfDay(new Date()));
    setMounted(true);
  }, []);

  // Real doctor list for the day view's per-doctor columns. Falls back to the
  // static defaults while loading / if the request fails.
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>(DEFAULT_DOCTORS);
  useEffect(() => {
    fetch('/api/admin/employees')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const items = (d.data as Array<{ id: string; first_name: string; last_name: string; role: string; is_active?: boolean }>)
          .filter((e) => e.role === 'doctor' && e.is_active !== false)
          .map((e) => ({ id: e.id, name: `${e.last_name} ${e.first_name}`.trim() }));
        if (items.length) setDoctors(items);
      })
      .catch(() => {});
  }, []);

  // ── compute the [from, to) range for the active view ─────────────────
  const { rangeFrom, rangeTo, gridDays } = useMemo(() => {
    if (view === 'day') {
      const from = startOfDay(focus);
      return { rangeFrom: from, rangeTo: addDays(from, 1), gridDays: [from] };
    }
    if (view === 'week') {
      const from = startOfWeek(focus);
      const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
      return { rangeFrom: from, rangeTo: addDays(from, 7), gridDays: days };
    }
    // month: 6×7 grid covering the visible month
    const monthFirst = startOfMonth(focus);
    const gridStart = startOfWeek(monthFirst);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    return { rangeFrom: gridStart, rangeTo: addDays(gridStart, 42), gridDays: days };
  }, [view, focus]);

  useEffect(() => {
    if (!mounted) return; // wait until "today" is resolved on the client
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/calendar?from=${encodeURIComponent(rangeFrom.toISOString())}&to=${encodeURIComponent(rangeTo.toISOString())}`
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load calendar');
        }
        const appts: ApiAppointment[] = json.data.appointments;
        const blocks: ApiBlock[] = json.data.blocks;
        const evs: CalendarEvent[] = [];
        for (const a of appts) {
          const start = new Date(a.scheduled_at);
          const end = new Date(start.getTime() + a.duration_minutes * 60 * 1000);
          evs.push({ kind: 'appt', id: a.id, start, end, legend: legendKeyFor(a.status, a.source), appt: a });
        }
        for (const b of blocks) {
          evs.push({ kind: 'block', id: b.id, start: new Date(b.starts_at), end: new Date(b.ends_at), legend: 'doctor_off', block: b });
        }
        if (!cancelled) setEvents(evs);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mounted, rangeFrom, rangeTo]);

  function shift(direction: -1 | 1) {
    if (view === 'day') setFocus(addDays(focus, direction));
    else if (view === 'week') setFocus(addDays(focus, 7 * direction));
    else {
      const x = new Date(focus);
      x.setMonth(x.getMonth() + direction);
      setFocus(startOfDay(x));
    }
  }

  const headerLabel =
    view === 'month' ? fmtMonthYear(focus)
    : view === 'week' ? `${fmtDayLong(gridDays[0])} – ${fmtDayLong(gridDays[6])}`
    : fmtDayLong(focus);

  // Render a static skeleton on the server / before hydration so the SSR HTML
  // and the first client paint always match (no date-dependent strings).
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 mr-auto">
            <div className="h-9 w-9 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" />
            <div className="h-9 w-20 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" />
            <div className="h-9 w-9 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" />
          </div>
          <div className="h-9 w-48 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" />
        </div>
        <div className="bg-white rounded-xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800 p-6">
          <div className="text-sm text-stone-500 dark:text-stone-400">Ачаалж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <ActiveEventCtx.Provider value={{ activeId, setActiveId }}>
    <div className="space-y-4" onClick={(e) => {
      // Clicking blank calendar area releases the lifted block.
      // Skip if the click is on or inside an event block (Link/div with role).
      const t = e.target as HTMLElement;
      if (!t.closest('[data-event-block]')) setActiveId(null);
    }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 mr-auto">
          <button
            onClick={() => shift(-1)}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setFocus(startOfDay(new Date()))}
            className="px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Өнөөдөр
          </button>
          <button
            onClick={() => shift(1)}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-3 text-sm font-medium text-stone-700 dark:text-stone-300">
            {headerLabel}
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-stone-200 overflow-hidden bg-white dark:border-stone-800 dark:bg-stone-900">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-2 text-sm transition-colors ${
                view === v
                  ? 'bg-primary-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'
              }`}
            >
              {v === 'day' ? 'Өдөр' : v === 'week' ? '7 хоног' : 'Сар'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800 overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : loading ? (
          <div className="p-6 text-sm text-stone-500 dark:text-stone-400">Ачаалж байна...</div>
        ) : view === 'day' ? (
          <DayByDoctorGrid day={focus} events={events} doctors={doctors} />
        ) : view === 'week' ? (
          <DayOrWeekGrid days={gridDays} events={events} focus={focus} />
        ) : (
          <MonthGrid days={gridDays} events={events} monthOf={focus} />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800 p-4">
        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Тэмдэглэгээ</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {LEGEND_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span className={`inline-block w-3 h-3 rounded-sm ${LEGEND[k].swatch}`} />
              <span className="text-stone-700 dark:text-stone-300">{LEGEND[k].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </ActiveEventCtx.Provider>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Day / Week grid (1 or 7 columns of an hourly timeline)
// ──────────────────────────────────────────────────────────────────────────

function DayOrWeekGrid({ days, events, focus }: { days: Date[]; events: CalendarEvent[]; focus: Date }) {
  const router = useRouter();
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(140px, 1fr))` }}>
        {/* Header row */}
        <div className="border-b border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60" />
        {days.map((d) => {
          const isToday = sameDay(d, new Date());
          const isFocus = sameDay(d, focus);
          return (
            <div
              key={d.toISOString()}
              className={[
                'text-center py-2 border-b border-l border-stone-200 dark:border-stone-800',
                isFocus ? 'bg-primary-50/60 dark:bg-primary-950/30' : 'bg-stone-50/60 dark:bg-stone-900/60',
              ].join(' ')}
            >
              <div className="text-xs text-stone-500 dark:text-stone-400">{WEEKDAY_SHORT[d.getDay()]}</div>
              <div className={`text-sm font-semibold ${isToday ? 'text-primary-600 dark:text-primary-300' : 'text-stone-900 dark:text-stone-100'}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}

        {/* Time gutter */}
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 px-2 text-[10px] text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const dayStart = startOfDay(d);
          const dayEnd = addDays(dayStart, 1);
          const dayEvents = events
            .filter((e) => e.end > dayStart && e.start < dayEnd)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          return (
            <div
              key={d.toISOString()}
              className="relative border-l border-stone-200 dark:border-stone-800"
              style={{ height: totalHeight }}
            >
              {hours.map((h, i) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => router.push(buildCreateUrl({ day: d, hour: h }))}
                  title={`${fmtTime(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0))} — Цаг захиалга үүсгэх`}
                  className="group absolute left-0 right-0 border-t border-stone-100 dark:border-stone-800 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 transition-colors"
                  style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center text-primary-600 dark:text-primary-300 pointer-events-none">
                    <Plus size={14} />
                  </span>
                </button>
              ))}
              {(() => {
                const layout = layoutEvents(dayEvents);
                const dayEndPx = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
                return dayEvents.map((ev) => {
                  const startClamped = ev.start < dayStart ? dayStart : ev.start;
                  const endClamped = ev.end > dayEnd ? dayEnd : ev.end;
                  const startMin = (startClamped.getHours() - HOUR_START) * 60 + startClamped.getMinutes();
                  const endMin = (endClamped.getHours() - HOUR_START) * 60 + endClamped.getMinutes();
                  if (endMin <= 0 || startMin >= (HOUR_END - HOUR_START) * 60) return null;
                  const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
                  const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
                  const li = layout.get(ev.id) ?? { lane: 0, lanes: 1 };
                  // Distance (in px) from this event's top to either the next
                  // event in its lane or the end of the visible day.
                  const nextStartPx = li.nextStartMs !== undefined
                    ? (((new Date(li.nextStartMs).getHours() - HOUR_START) * 60 +
                        new Date(li.nextStartMs).getMinutes()) / 60) * HOUR_HEIGHT
                    : dayEndPx;
                  const maxHeight = Math.max(height, nextStartPx - top - 2);
                  return (
                    <EventBlock
                      key={ev.id}
                      ev={ev}
                      top={top}
                      height={height}
                      maxHeight={maxHeight}
                      lane={li.lane}
                      lanes={li.lanes}
                      expandOnHover
                    />
                  );
                });
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Shared event block
// ──────────────────────────────────────────────────────────────────────────

function EventBlock({
  ev,
  top,
  height,
  maxHeight,
  lane = 0,
  lanes = 1,
  expandOnHover,
}: {
  ev: CalendarEvent;
  top: number;
  height: number;
  /** Maximum height the block may claim before colliding with the next event in its lane. Lets short-slot blocks grow into empty space to fit their content. */
  maxHeight?: number;
  lane?: number;
  lanes?: number;
  expandOnHover?: boolean;
}) {
  const meta = LEGEND[ev.legend];
  const title =
    ev.kind === 'appt'
      ? `${ev.appt.full_name} — ${ev.appt.service_type}`
      : `${ev.block.reason ?? 'Ажиллахгүй'}${ev.block.doctor_name ? ` (${ev.block.doctor_name})` : ''}`;

  // ── Lifted state lives at the calendar root: the last-hovered block is the
  // "active" one and stays on top until another block is hovered (or the user
  // clicks on blank calendar area).
  const { activeId, setActiveId } = useContext(ActiveEventCtx);
  const isActive = activeId === ev.id;

  const activate = () => setActiveId(ev.id);

  // When the block has room to grow (active, OR there's empty space below it),
  // let text wrap onto extra lines instead of truncating with an ellipsis.
  const canWrap = isActive || (maxHeight !== undefined && maxHeight > height + 4);

  const inner = (
    <>
      <div className={`font-medium ${canWrap ? 'whitespace-normal' : 'truncate'}`}>
        {fmtTime(ev.start)} {ev.kind === 'appt' ? ev.appt.full_name : (ev.block.reason ?? 'Ажиллахгүй')}
      </div>
      {ev.kind === 'appt' && !isActive && (
        // Compact (non-hovered) state: just the service type below the name.
        <div className={`opacity-80 ${canWrap ? 'whitespace-normal' : 'truncate'}`}>{ev.appt.service_type}</div>
      )}
      {/* Expanded details only shown when active (hovered) — the day-by-doctor
          view already groups by doctor, but the week view collapses them so the
          assigned doctor / contact info isn't otherwise visible. */}
      {isActive && ev.kind === 'appt' && (
        <div className="mt-1 space-y-0.5 text-[11px] opacity-90 whitespace-normal">
          {ev.appt.service_type && (
            <div><span className="opacity-70">Эмчилгээ:</span> {ev.appt.service_type}</div>
          )}
          {ev.appt.doctor_name && (
            <div><span className="opacity-70">Эмч:</span> {ev.appt.doctor_name}</div>
          )}
          {ev.appt.phone && (
            <div className="font-mono"><span className="opacity-70 font-sans">Утас:</span> {ev.appt.phone}</div>
          )}
        </div>
      )}
    </>
  );

  const cls = `absolute rounded-md border px-2 py-1 text-xs cursor-pointer transition-[box-shadow,left,width,height] duration-150 ${
    isActive ? 'z-30 shadow-lg ring-1 ring-stone-400/30' : 'z-0'
  } ${expandOnHover && isActive ? '' : 'overflow-hidden'} ${meta.block}`;

  // Lane layout: each lane gets 1/lanes of the column width, with a small gutter
  // between siblings. When active, the block expands to span the entire column
  // (width 100%, left 0) so the user can read the full content.
  const widthPct = 100 / lanes;
  const leftPct = (lane * 100) / lanes;
  const style: React.CSSProperties = isActive
    ? {
        top,
        left: 4,
        right: 4,
        minHeight: height,
        height: expandOnHover ? 'auto' : height,
      }
    : {
        top,
        left: `calc(${leftPct}% + 4px)`,
        width: `calc(${widthPct}% - ${lanes > 1 ? 6 : 8}px)`,
        // Let the block grow to fit its content, but never below its slot
        // height (so very short events stay visible) and never beyond the
        // start of the next event in the same lane (no visual collision).
        minHeight: height,
        height: 'auto',
        maxHeight: maxHeight ?? height,
      };

  const sharedHandlers = {
    onMouseEnter: activate,
    onFocus: activate,
    'data-event-block': true as unknown as string,
  };

  if (ev.kind === 'appt') {
    return (
      <Link
        href={`/admin/appointments/detail/${ev.id}`}
        title={`${fmtTime(ev.start)}–${fmtTime(ev.end)} · ${title}`}
        className={cls}
        style={style}
        {...sharedHandlers}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      title={`${fmtTime(ev.start)}–${fmtTime(ev.end)} · ${title}`}
      className={cls}
      style={style}
      {...sharedHandlers}
    >
      {inner}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Day-by-doctor grid — one column per doctor for a single day
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_DOCTORS: { id: string; name: string }[] = [
  { id: '1', name: 'Сонин Батсанаа' },
  { id: '2', name: 'Онон Эрдэнэбат' },
  { id: '3', name: 'Ганбаатар Эрдэнэзориг' },
  { id: '4', name: 'Ганбаяр Хонгорзул' },
  { id: '5', name: 'Ганболд Цэнгүүн' },
];

function DayByDoctorGrid({ day, events, doctors: doctorList }: { day: Date; events: CalendarEvent[]; doctors: { id: string; name: string }[] }) {
  const router = useRouter();
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const totalHeight = hours.length * HOUR_HEIGHT;
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  // Filter to today's events
  const todays = events.filter((e) => e.end > dayStart && e.start < dayEnd);

  // Resolve doctor list: union of the real doctor list and any unique doctor_ids found in today's events
  const doctorMap = new Map<string, string>();
  for (const d of doctorList) doctorMap.set(d.id, d.name);
  for (const ev of todays) {
    const id = ev.kind === 'appt' ? ev.appt.doctor_id : ev.block.doctor_id;
    const name = ev.kind === 'appt' ? ev.appt.doctor_name : ev.block.doctor_name;
    if (id && name && !doctorMap.has(id)) doctorMap.set(id, name);
  }
  const doctors = Array.from(doctorMap, ([id, name]) => ({ id, name }));

  // Bucket events by doctor; events without an assigned doctor go in a final "—" column
  const unassigned: CalendarEvent[] = [];
  const byDoctor = new Map<string, CalendarEvent[]>();
  for (const d of doctors) byDoctor.set(d.id, []);
  for (const ev of todays) {
    const docId = ev.kind === 'appt' ? ev.appt.doctor_id : ev.block.doctor_id;
    if (docId && byDoctor.has(docId)) byDoctor.get(docId)!.push(ev);
    else unassigned.push(ev);
  }

  const columns = [
    ...doctors.map((d) => ({ key: d.id, name: d.name, events: byDoctor.get(d.id) ?? [] })),
    ...(unassigned.length ? [{ key: '__unassigned', name: 'Хуваарилаагүй', events: unassigned }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(180px, 1fr))` }}>
        {/* Header: empty time gutter cell + doctor names */}
        <div className="border-b border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60" />
        {columns.map((col) => (
          <div
            key={col.key}
            className="text-center py-3 border-b border-l border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60"
          >
            <div className="text-xs text-stone-500 dark:text-stone-400">Эмч</div>
            <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate px-2">{col.name}</div>
          </div>
        ))}

        {/* Time gutter */}
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 px-2 text-[10px] text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Doctor columns */}
        {columns.map((col) => (
          <div
            key={col.key}
            className="relative border-l border-stone-200 dark:border-stone-800"
            style={{ height: totalHeight }}
          >
            {hours.map((h, i) => {
              const doctorId = col.key === '__unassigned' ? undefined : col.key;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => router.push(buildCreateUrl({ day, hour: h, doctorId }))}
                  title={`${fmtTime(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0))} — Цаг захиалга үүсгэх`}
                  className="group absolute left-0 right-0 border-t border-stone-100 dark:border-stone-800 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 transition-colors"
                  style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center text-primary-600 dark:text-primary-300 pointer-events-none">
                    <Plus size={14} />
                  </span>
                </button>
              );
            })}
            {(() => {
              const layout = layoutEvents(col.events);
              const dayEndPx = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
              return col.events.map((ev) => {
                const startClamped = ev.start < dayStart ? dayStart : ev.start;
                const endClamped = ev.end > dayEnd ? dayEnd : ev.end;
                const startMin = (startClamped.getHours() - HOUR_START) * 60 + startClamped.getMinutes();
                const endMin = (endClamped.getHours() - HOUR_START) * 60 + endClamped.getMinutes();
                if (endMin <= 0 || startMin >= (HOUR_END - HOUR_START) * 60) return null;
                const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
                const height = Math.max(20, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
                const li = layout.get(ev.id) ?? { lane: 0, lanes: 1 };
                const nextStartPx = li.nextStartMs !== undefined
                  ? (((new Date(li.nextStartMs).getHours() - HOUR_START) * 60 +
                      new Date(li.nextStartMs).getMinutes()) / 60) * HOUR_HEIGHT
                  : dayEndPx;
                const maxHeight = Math.max(height, nextStartPx - top - 2);
                return (
                  <EventBlock
                    key={ev.id}
                    ev={ev}
                    top={top}
                    height={height}
                    maxHeight={maxHeight}
                    lane={li.lane}
                    lanes={li.lanes}
                    expandOnHover
                  />
                );
              });
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Month grid — counts per day broken down by status
// ──────────────────────────────────────────────────────────────────────────

function MonthGrid({ days, events, monthOf }: { days: Date[]; events: CalendarEvent[]; monthOf: Date }) {
  const focusMonth = monthOf.getMonth();
  return (
    <div>
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className="text-xs font-medium text-stone-500 dark:text-stone-400 text-center py-2">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const dayStart = startOfDay(d);
          const dayEnd = addDays(dayStart, 1);
          const dayEvents = events.filter((e) => e.end > dayStart && e.start < dayEnd);
          const counts = new Map<LegendKey, number>();
          for (const ev of dayEvents) counts.set(ev.legend, (counts.get(ev.legend) ?? 0) + 1);
          const total = dayEvents.length;
          const inMonth = d.getMonth() === focusMonth;
          const isToday = sameDay(d, new Date());

          return (
            <div
              key={d.toISOString()}
              className={[
                'min-h-[120px] border-b border-l border-stone-200 dark:border-stone-800 p-2',
                inMonth ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/60 dark:bg-stone-950/40',
                isToday ? 'ring-1 ring-inset ring-primary-300 bg-primary-50/60 dark:ring-primary-700 dark:bg-primary-950/30' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs font-semibold ${inMonth ? (isToday ? 'text-primary-600 dark:text-primary-300' : 'text-stone-900 dark:text-stone-100') : 'text-stone-400 dark:text-stone-600'}`}>
                  {d.getDate()}
                </div>
              </div>
              {total > 0 && (
                <div className={`text-[11px] mb-1 pb-1 border-b border-stone-200 dark:border-stone-800 ${inMonth ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-600'}`}>
                  <span className="font-medium">Нийт:</span> {total}
                </div>
              )}
              <div className="space-y-0.5">
                {LEGEND_ORDER.map((k) => {
                  const c = counts.get(k);
                  if (!c) return null;
                  return (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className={`flex items-center gap-1 ${inMonth ? '' : 'opacity-60'}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${LEGEND[k].swatch}`} />
                        <span className="truncate">{LEGEND[k].label}</span>
                      </span>
                      <span className={`tabular-nums ${inMonth ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-600'}`}>{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
