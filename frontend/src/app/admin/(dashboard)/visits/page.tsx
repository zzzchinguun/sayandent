'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';

// ────────────────────────── Types ──────────────────────────

interface ApiAppointment {
  id: string;
  patient_id?: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  service_type: string;
  notes: string | null;
  status: string;
  source: string;
  scheduled_at: string;
  duration_minutes: number;
  doctor_id: string | null;
  doctor_name: string | null;
  branch?: string | null;
  order_diagnosis?: string | null;
  visit_type?: 'first' | 'repeat' | 'us' | null;
}

// ────────────────────────── Static config ──────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  booked: {
    label: 'Захиалсан',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  arrived: {
    label: 'Ирсэн',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  },
  examined: {
    label: 'Үзлэг дууссан',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  paid: {
    label: 'Төлбөр хийгдсэн',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  cancelled_by_patient: {
    label: 'Үйлчлүүлэгч цуцласан',
    className: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
  cancelled_by_doctor: {
    label: 'Эмч цуцласан',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Бүх төлөв' },
  { value: 'booked', label: 'Захиалсан' },
  { value: 'arrived', label: 'Ирсэн' },
  { value: 'examined', label: 'Үзлэг дууссан' },
  { value: 'paid', label: 'Төлбөр хийгдсэн' },
  { value: 'cancelled_by_patient', label: 'Үйлчлүүлэгч цуцласан' },
  { value: 'cancelled_by_doctor', label: 'Эмч цуцласан' },
];

const VISIT_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  first:  { label: 'Анх удаа', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  repeat: { label: 'Давтан',   className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  us:     { label: 'У.С үзлэг', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

const VISIT_TYPE_OPTIONS = [
  { value: '',       label: 'Бүх төрөл' },
  { value: 'first',  label: 'Анх удаа' },
  { value: 'repeat', label: 'Давтан' },
  { value: 'us',     label: 'У.С үзлэг' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today',     label: 'Өнөөдөр' },
  { value: 'yesterday', label: 'Өчигдөр' },
  { value: 'this_week', label: 'Энэ долоо хоног' },
  { value: 'this_month',label: 'Энэ сар' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ────────────────────────── Helpers ──────────────────────────

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rangeFor(opt: string): { from: Date; to: Date } {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (opt === 'yesterday') {
    const y = new Date(start); y.setDate(y.getDate() - 1);
    return { from: y, to: start };
  }
  if (opt === 'this_week') {
    const dow = (start.getDay() + 6) % 7; // Mon=0
    const monday = new Date(start); monday.setDate(monday.getDate() - dow);
    const nextMonday = new Date(monday); nextMonday.setDate(nextMonday.getDate() + 7);
    return { from: monday, to: nextMonday };
  }
  if (opt === 'this_month') {
    const monthStart = new Date(start); monthStart.setDate(1);
    const nextMonth = new Date(monthStart); nextMonth.setMonth(nextMonth.getMonth() + 1);
    return { from: monthStart, to: nextMonth };
  }
  // today
  const tomorrow = new Date(start); tomorrow.setDate(tomorrow.getDate() + 1);
  return { from: start, to: tomorrow };
}

// ────────────────────────── Page ──────────────────────────

export default function VisitsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('today');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [menuFor, setMenuFor] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Fetch visits whenever the date range changes (after mount, to avoid hydration date mismatch)
  useEffect(() => {
    if (!mounted) return;
    const { from, to } = rangeFor(dateRange);
    setLoading(true);
    fetch(`/api/admin/calendar?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setItems(data.data.appointments || []);
        else setItems([]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [mounted, dateRange]);

  // Close action menu on outside click / scroll / resize
  useEffect(() => {
    if (!menuFor) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    const close = () => setMenuFor(null);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menuFor]);

  // Available doctors / branches for the filter dropdowns
  const { doctors, branches } = useMemo(() => {
    const d = new Map<string, string>();
    const b = new Set<string>();
    for (const it of items) {
      if (it.doctor_name) d.set(it.doctor_name, it.doctor_name);
      if (it.branch) b.add(it.branch);
    }
    if (b.size === 0) b.add('Төв салбар');
    return {
      doctors: Array.from(d.values()).sort(),
      branches: Array.from(b.values()).sort(),
    };
  }, [items]);

  // Apply filters & sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = items.filter((it) => {
      if (statusFilter && it.status !== statusFilter) return false;
      if (typeFilter && (it.visit_type ?? 'first') !== typeFilter) return false;
      if (doctorFilter && it.doctor_name !== doctorFilter) return false;
      if (branchFilter && (it.branch || 'Төв салбар') !== branchFilter) return false;
      if (q && !(
        it.full_name.toLowerCase().includes(q) ||
        it.phone.includes(q) ||
        (it.service_type ?? '').toLowerCase().includes(q) ||
        (it.doctor_name ?? '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const t = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      return sortDir === 'asc' ? t : -t;
    });
    return arr;
  }, [items, search, statusFilter, typeFilter, doctorFilter, branchFilter, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, doctorFilter, branchFilter, dateRange, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(total, pageStart + pageSize);
  const paged = filtered.slice(pageStart, pageEnd);

  // Stats — derived from currently-filtered set so they reflect what the user sees
  const stats = useMemo(() => {
    let done = 0, pending = 0;
    for (const it of filtered) {
      if (it.status === 'examined' || it.status === 'paid') done++;
      else if (it.status === 'booked' || it.status === 'arrived') pending++;
    }
    return { total: filtered.length, done, pending };
  }, [filtered]);

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setTypeFilter('');
    setDoctorFilter(''); setBranchFilter('');
  };
  const filtersActive = !!(search || statusFilter || typeFilter || doctorFilter || branchFilter);

  const openMenu = (id: string, btnEl: HTMLElement) => {
    const MENU_W = 176;
    const MENU_H = 132;
    const rect = btnEl.getBoundingClientRect();
    const flipUp = rect.bottom + MENU_H + 8 > window.innerHeight;
    const x = Math.max(8, Math.min(window.innerWidth - MENU_W - 8, rect.left));
    const y = flipUp ? rect.top - MENU_H - 4 : rect.bottom + 4;
    setMenuFor({ id, x, y });
  };

  const inputClass = 'px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Үзлэгүүд</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 dark:text-stone-400">Огнооны муж:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`${inputClass} min-w-[160px]`}
          >
            {DATE_RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Нийт үзлэг" value={stats.total} tone="default" loading={loading} />
        <StatCard label="Дууссан үзлэг" value={stats.done} tone="green" loading={loading} />
        <StatCard label="Хүлээгдэж буй үзлэг" value={stats.pending} tone="orange" loading={loading} />
      </div>

      {/* Filter bar */}
      <div className="bg-stone-100/70 dark:bg-stone-800/60 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Хайлт"
          className={`${inputClass} flex-1 min-w-[200px] max-w-xs`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} min-w-[140px] max-w-[180px]`}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label || 'Төлөв'}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputClass} min-w-[140px] max-w-[180px]`}>
          {VISIT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label || 'Төрөл'}</option>)}
        </select>
        <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className={`${inputClass} min-w-[140px] max-w-[180px]`}>
          <option value="">Эмч</option>
          {doctors.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className={`${inputClass} min-w-[140px] max-w-[180px]`}>
          <option value="">Салбар</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!filtersActive}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950/30 transition-colors"
        >
          Цэвэрлэх
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 dark:border-stone-800">
            <tr className="text-left text-stone-500 dark:text-stone-400">
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => setSortDir((s) => (s === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  Огноо цаг
                  {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Эмчлүүлэгч</th>
              <th className="px-4 py-3 font-medium">Эмч</th>
              <th className="px-4 py-3 font-medium">Салбар</th>
              <th className="px-4 py-3 font-medium">Захиалгын онош</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
              <th className="px-4 py-3 font-medium">Үзлэгийн төрөл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone-500 dark:text-stone-400">Уншиж байна...</td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone-500 dark:text-stone-400">Үзлэг олдсонгүй</td>
              </tr>
            )}
            {!loading && paged.map((v) => {
              const dt = new Date(v.scheduled_at);
              const stat = STATUS_BADGE[v.status] ?? { label: v.status, className: 'bg-stone-100 text-stone-700' };
              const vt = VISIT_TYPE_BADGE[v.visit_type ?? 'first'] ?? { label: '—', className: '' };
              return (
                <tr key={v.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="w-10 px-2 py-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openMenu(v.id, e.currentTarget); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
                      aria-label="Үйлдэл"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-stone-900 dark:text-stone-100 font-medium">{fmtDate(dt)}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">{fmtTime(dt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-stone-900 dark:text-stone-100">{v.full_name}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">{v.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.doctor_name || '—'}</td>
                  <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.branch || 'Төв салбар'}</td>
                  <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{v.order_diagnosis || v.service_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${stat.className}`}>
                      {stat.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${vt.className}`}>
                      {vt.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <span>{total === 0 ? '0' : `${pageStart + 1}-${pageEnd}`} / {total}</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="px-2 py-1 text-sm rounded-md border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>/ хуудас</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <ChevronLeft size={14} /> Өмнөх
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`w-9 h-8 rounded-md text-sm font-medium transition-colors ${
                n === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Дараах <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Floating action menu */}
      {menuFor && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: menuFor.x, top: menuFor.y, zIndex: 50 }}
          className="w-44 rounded-lg bg-white border border-stone-200 shadow-lg overflow-hidden dark:bg-stone-900 dark:border-stone-700"
        >
          <Link
            href={`/admin/appointments/detail/${menuFor.id}`}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <Eye size={14} /> Харах
          </Link>
          <Link
            href={`/admin/appointments/detail/${menuFor.id}`}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <Pencil size={14} /> Засах
          </Link>
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Энэ үзлэгийг устгах уу?')) return;
              await fetch(`/api/admin/appointments/${menuFor.id}`, { method: 'DELETE' });
              setMenuFor(null);
              setItems((arr) => arr.filter((x) => x.id !== menuFor.id));
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 size={14} /> Устгах
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────── Stat card ──────────────────────────

function StatCard({
  label, value, tone, loading,
}: {
  label: string;
  value: number;
  tone: 'default' | 'green' | 'orange';
  loading?: boolean;
}) {
  const valueColor =
    tone === 'green' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'orange' ? 'text-orange-500 dark:text-orange-400'
    : 'text-stone-900 dark:text-stone-50';
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5">
      <div className="text-sm text-stone-500 dark:text-stone-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${valueColor}`}>
        {loading ? <span className="text-stone-300 dark:text-stone-700">—</span> : value}
      </div>
    </div>
  );
}
