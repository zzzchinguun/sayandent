'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface Doctor { id: string; name: string }

const DEFAULT_DOCTORS: Doctor[] = [
  { id: '1', name: 'Сонин Батсанаа' },
  { id: '2', name: 'Онон Эрдэнэбат' },
  { id: '3', name: 'Ганбаатар Эрдэнэзориг' },
  { id: '4', name: 'Ганбаяр Хонгорзул' },
  { id: '5', name: 'Ганболд Цэнгүүн' },
];

const BRANCHES = [
  { id: '1', name: 'Төв салбар' },
];

const VISIT_TYPES = [
  { value: 'first',  label: 'Анх удаа' },
  { value: 'repeat', label: 'Давтан' },
  { value: 'us',     label: 'У.С үзлэг' },
];

const ORDER_DIAGNOSIS_OPTIONS = ['Анхан үзлэг', 'Давтан үзлэг', 'Гажиг засал', 'Эмчилгээ'];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function CreateAppointmentPage() {
  return (
    <Suspense fallback={<div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>}>
      <CreateAppointmentInner />
    </Suspense>
  );
}

function CreateAppointmentInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const branchId = sp.get('branch_id') ?? '1';
  const userId = sp.get('user_id') ?? '';
  const startDateParam = sp.get('start_date') ?? '';

  // Parse the incoming start_date into a datetime-local-friendly value
  const parsedStart = (() => {
    if (!startDateParam) return '';
    const d = new Date(startDateParam);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const [doctors, setDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    branch_id: branchId,
    doctor_id: userId,
    scheduled_at: parsedStart,
    duration_minutes: 30,
    order_diagnosis: ORDER_DIAGNOSIS_OPTIONS[0],
    visit_type: 'first' as 'first' | 'repeat' | 'us',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Best-effort: load real doctors from the employees API; fall back to defaults
    fetch('/api/admin/employees').then((r) => r.json()).then((d) => {
      if (!d.success) return;
      const items = (d.data as Array<{ id: string; first_name: string; last_name: string; role: string; is_active?: boolean }>)
        .filter((e) => e.role === 'doctor' && e.is_active !== false)
        .map((e) => ({ id: e.id, name: `${e.last_name} ${e.first_name}`.trim() }));
      if (items.length) setDoctors(items);
    }).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: form.duration_minutes,
        doctor_id: form.doctor_id || undefined,
        service_type: form.order_diagnosis,
        notes: form.notes || undefined,
        source: 'manual',
        status: 'booked',
      };
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Хадгалж чадсангүй');
      }
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <ChevronLeft size={18} />
          </Link>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Цаг захиалга үүсгэх</h2>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          <Link
            href="/admin"
            className="px-5 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            Болих
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-4">
            Эмчлүүлэгчийн мэдээлэл
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className={labelClass}>Овог нэр <span className="text-red-500">*</span></label>
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Утас <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>И-мэйл</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-4">
            Цаг захиалга
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Эхлэх цаг <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Үргэлжлэх хугацаа</label>
              <select
                value={form.duration_minutes}
                onChange={(e) => set('duration_minutes', parseInt(e.target.value, 10))}
                className={inputClass}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} мин</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Салбар</label>
              <select
                value={form.branch_id}
                onChange={(e) => set('branch_id', e.target.value)}
                className={inputClass}
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Эмч</label>
              <select
                value={form.doctor_id}
                onChange={(e) => set('doctor_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Сонгох</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Захиалгын онош</label>
              <select
                value={form.order_diagnosis}
                onChange={(e) => set('order_diagnosis', e.target.value)}
                className={inputClass}
              >
                {ORDER_DIAGNOSIS_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className={labelClass}>Анхан давтан эсэх</span>
              <div className="flex flex-wrap items-center gap-5 pt-1">
                {VISIT_TYPES.map((v) => (
                  <label key={v.value} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="visit-type"
                      checked={form.visit_type === v.value}
                      onChange={() => set('visit_type', v.value as 'first' | 'repeat' | 'us')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-stone-700 dark:text-stone-300">{v.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Тэмдэглэл</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
