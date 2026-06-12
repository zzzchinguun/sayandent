'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Search, UserPlus, X } from 'lucide-react';

interface Doctor { id: string; name: string }

interface PatientLite {
  id: string;
  card_number: number;
  last_name: string;
  first_name: string;
  registry_number: string | null;
  phone: string;
}

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

  // ── Patient picker state ─────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientLite | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    last_name: '',
    first_name: '',
    registry_number: '',
    phone: '',
    email: '',
  });

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients
      .filter((p) => {
        const name = `${p.last_name} ${p.first_name}`.toLowerCase();
        const reverse = `${p.first_name} ${p.last_name}`.toLowerCase();
        return (
          name.includes(q) ||
          reverse.includes(q) ||
          (p.registry_number ?? '').toLowerCase().includes(q) ||
          p.phone.includes(q)
        );
      })
      .slice(0, 8);
  }, [patients, patientSearch]);

  // An already-registered patient with the same registry number, if any.
  const regDuplicate = useMemo(() => {
    const q = newPatient.registry_number.trim().toLowerCase();
    if (!q) return null;
    return patients.find((p) => (p.registry_number ?? '').toLowerCase() === q) ?? null;
  }, [patients, newPatient.registry_number]);

  const [form, setForm] = useState({
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

    // Patient list for the searchable picker
    fetch('/api/admin/patients').then((r) => r.json()).then((d) => {
      if (d.success) setPatients(d.data as PatientLite[]);
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
      // Resolve the patient: either picked from the registry, or created now.
      let patient: { full_name: string; phone: string; email?: string };
      if (patientMode === 'existing') {
        if (!selectedPatient) {
          setError('Эмчлүүлэгч сонгоно уу');
          setSaving(false);
          return;
        }
        patient = {
          full_name: `${selectedPatient.last_name} ${selectedPatient.first_name}`.trim(),
          phone: selectedPatient.phone,
        };
      } else {
        if (!newPatient.last_name || !newPatient.first_name || !newPatient.phone) {
          setError('Овог, нэр, утас заавал шаардлагатай');
          setSaving(false);
          return;
        }
        if (regDuplicate) {
          setError('Энэ регистрийн дугаартай эмчлүүлэгч аль хэдийн бүртгэлтэй байна');
          setSaving(false);
          return;
        }
        const created = await fetch('/api/admin/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            last_name: newPatient.last_name,
            first_name: newPatient.first_name,
            registry_number: newPatient.registry_number || undefined,
            phone: newPatient.phone,
            email: newPatient.email || undefined,
          }),
        });
        const createdData = await created.json().catch(() => ({}));
        if (!createdData.success) {
          setError(createdData.error || 'Эмчлүүлэгч үүсгэж чадсангүй');
          setSaving(false);
          return;
        }
        patient = {
          full_name: `${newPatient.last_name} ${newPatient.first_name}`.trim(),
          phone: newPatient.phone,
          email: newPatient.email || undefined,
        };
      }

      const body = {
        full_name: patient.full_name,
        phone: patient.phone,
        email: patient.email,
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
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
              Эмчлүүлэгчийн мэдээлэл
            </h3>
            <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setPatientMode('existing')}
                className={
                  patientMode === 'existing'
                    ? 'px-4 py-1.5 bg-primary-600 text-white font-medium'
                    : 'px-4 py-1.5 text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'
                }
              >
                Бүртгэлтэй
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('new')}
                className={
                  patientMode === 'new'
                    ? 'px-4 py-1.5 bg-primary-600 text-white font-medium'
                    : 'px-4 py-1.5 text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'
                }
              >
                <span className="inline-flex items-center gap-1.5"><UserPlus size={14} /> Шинэ</span>
              </button>
            </div>
          </div>

          {patientMode === 'existing' ? (
            selectedPatient ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-primary-200 bg-primary-50/60 dark:border-primary-900 dark:bg-primary-950/30 px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    №{selectedPatient.card_number} — {selectedPatient.last_name} {selectedPatient.first_name}
                  </p>
                  <p className="text-stone-600 dark:text-stone-400">
                    {selectedPatient.registry_number || 'Регистргүй'} · {selectedPatient.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                  className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-white hover:text-stone-700 dark:hover:bg-stone-800"
                  title="Өөр эмчлүүлэгч сонгох"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative max-w-xl">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                  placeholder="Нэр, регистр эсвэл утсаар хайх..."
                  className={inputClass + ' pl-9'}
                />
                {dropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800">
                    {filteredPatients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400">
                        Олдсонгүй — &ldquo;Шинэ&rdquo; товчоор бүртгэнэ үү
                      </p>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => { setSelectedPatient(p); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-700/60"
                        >
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            №{p.card_number} {p.last_name} {p.first_name}
                          </span>
                          <span className="ml-2 text-stone-500 dark:text-stone-400">
                            {p.registry_number || '—'} · {p.phone}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Овог <span className="text-red-500">*</span></label>
                <input
                  value={newPatient.last_name}
                  onChange={(e) => setNewPatient((p) => ({ ...p, last_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Нэр <span className="text-red-500">*</span></label>
                <input
                  value={newPatient.first_name}
                  onChange={(e) => setNewPatient((p) => ({ ...p, first_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Регистр</label>
                <input
                  value={newPatient.registry_number}
                  onChange={(e) => setNewPatient((p) => ({ ...p, registry_number: e.target.value }))}
                  className={inputClass}
                />
                {regDuplicate && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    <span>
                      Бүртгэлтэй: №{regDuplicate.card_number} {regDuplicate.last_name} {regDuplicate.first_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(regDuplicate);
                        setPatientMode('existing');
                      }}
                      className="shrink-0 font-medium underline underline-offset-2 hover:opacity-70"
                    >
                      Сонгох
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Утас <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>И-мэйл</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          )}
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
