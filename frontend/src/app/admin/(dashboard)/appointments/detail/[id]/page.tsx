'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Crown, Check } from 'lucide-react';

interface Appointment {
  id: string;
  patient_id?: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  card_number?: number | null;
  patient_type?: string | null;
  service_type: string;
  notes: string | null;
  status: string;
  source: string;
  scheduled_at: string;
  ends_at?: string | null;
  duration_minutes: number;
  doctor_id: string | null;
  doctor_name: string | null;
  branch?: string | null;
  order_diagnosis?: string | null;
  visit_type?: 'first' | 'repeat' | 'us' | null;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'booked',                label: 'Захиалга өгсөн' },
  { value: 'arrived',               label: 'Ирсэн' },
  { value: 'examined',              label: 'Үзлэг дууссан' },
  { value: 'paid',                  label: 'Төлбөр хийгдсэн' },
  { value: 'cancelled_by_patient',  label: 'Үйлчлүүлэгч цуцласан' },
  { value: 'cancelled_by_doctor',   label: 'Эмч цуцласан' },
];

const PATIENT_TYPE_LABELS: Record<string, string> = {
  regular: 'Энгийн',
  bronze: 'Хүрэл',
  silver: 'Мөнгө',
  gold: 'Алт',
};

const VISIT_TYPES: { value: 'first' | 'repeat' | 'us'; label: string }[] = [
  { value: 'first',  label: 'Анх удаа' },
  { value: 'repeat', label: 'Давтан' },
  { value: 'us',     label: 'У.С үзлэг' },
];

const ORDER_DIAGNOSIS_OPTIONS = [
  'Анхан үзлэг',
  'Давтан үзлэг',
  'Гажиг засал',
  'Эмчилгээ',
];

type LeftTab = 'treatment' | 'patient' | 'others';
type Step = 1 | 2 | 3;

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDateTimeLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leftTab, setLeftTab] = useState<LeftTab>('treatment');
  const [step, setStep] = useState<Step>(1);
  const [savingStatus, setSavingStatus] = useState(false);

  // Form state mirrors the appointment but lets the user edit it
  const [statusValue, setStatusValue] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [visitType, setVisitType] = useState<'first' | 'repeat' | 'us'>('first');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/appointments/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
        if (cancelled) return;
        setAppt(json.data);
        setStatusValue(json.data.status ?? 'booked');
        setNotesValue(json.data.notes ?? '');
        setVisitType((json.data.visit_type as 'first' | 'repeat' | 'us') ?? 'first');
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function saveStatus() {
    if (!appt) return;
    setSavingStatus(true);
    try {
      await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusValue, notes: notesValue }),
      });
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>;
  }
  if (error || !appt) {
    return (
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 mb-4">
          <ChevronLeft size={16} /> Буцах
        </Link>
        <div className="text-rose-600 dark:text-rose-400">{error || 'Цаг захиалга олдсонгүй'}</div>
      </div>
    );
  }

  const startIso = appt.scheduled_at;
  const endIso = appt.ends_at ?? new Date(new Date(appt.scheduled_at).getTime() + appt.duration_minutes * 60 * 1000).toISOString();
  const nameParts = appt.full_name.split(' ');
  const lastName = nameParts[0] ?? '';
  const firstName = nameParts.slice(1).join(' ') || '';
  const initial = (lastName.charAt(0) || appt.full_name.charAt(0) || '?').toUpperCase();
  const ptypeLabel = appt.patient_type ? (PATIENT_TYPE_LABELS[appt.patient_type] ?? appt.patient_type) : 'Энгийн';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <ChevronLeft size={18} />
        </Link>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Цаг захиалгын дэлгэрэнгүй</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Left card ── */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Patient header — clickable, navigates to patient details */}
          {appt.patient_id ? (
            <Link
              href={`/admin/patients/details/${appt.patient_id}`}
              className="flex items-start justify-between gap-3 p-5 pb-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 flex items-center justify-center text-xl font-bold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-stone-900 dark:text-stone-50 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400">{lastName}</div>
                  <div className="text-base font-semibold text-stone-900 dark:text-stone-50 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400">{firstName}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-600 text-white shrink-0">
                <Crown size={12} /> {ptypeLabel}
              </span>
            </Link>
          ) : (
            <div className="flex items-start justify-between gap-3 p-5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 flex items-center justify-center text-xl font-bold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-stone-900 dark:text-stone-50 truncate">{lastName}</div>
                  <div className="text-base font-semibold text-stone-900 dark:text-stone-50 truncate">{firstName}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-600 text-white shrink-0">
                <Crown size={12} /> {ptypeLabel}
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-stretch border-b border-stone-200 dark:border-stone-800 px-2">
            <LeftTabBtn active={leftTab === 'treatment'} onClick={() => setLeftTab('treatment')}>
              Эмчилгээний<br />мэдээлэл
            </LeftTabBtn>
            <LeftTabBtn active={leftTab === 'patient'}   onClick={() => setLeftTab('patient')}>
              Эмчлүүлэгчийн<br />мэдээлэл
            </LeftTabBtn>
            <LeftTabBtn active={leftTab === 'others'}    onClick={() => setLeftTab('others')}>
              Өнөөдрийн бусад<br />захиалгууд
            </LeftTabBtn>
          </div>

          <div className="p-5">
            {leftTab === 'treatment' && (
              <>
                <div className="space-y-3">
                  <Row label="Эмч"           value={appt.doctor_name || '-'} bold />
                  <Row label="Салбар"        value={appt.branch || 'Төв салбар'} bold />
                  <Row label="Захиалгын онош" value={appt.order_diagnosis || appt.service_type || '-'} bold />
                  <Row label="Эхлэх цаг"     value={fmtDateTime(startIso)} bold />
                  <Row label="Дуусах цаг"    value={fmtDateTime(endIso)} bold />
                  <Row label="Картын дугаар" value={appt.card_number ? String(appt.card_number) : '-'} bold />
                </div>

                <div className="mt-5">
                  <label className="block text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1.5">Тэмдэглэл</label>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mt-5">
                  <label className="block text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1.5">Төлөв</label>
                  <div className="flex items-stretch gap-2">
                    <select
                      value={statusValue}
                      onChange={(e) => setStatusValue(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={saveStatus}
                      disabled={savingStatus}
                      className="shrink-0 inline-flex items-center justify-center w-10 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      title="Хадгалах"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {leftTab === 'patient' && (
              <div className="space-y-3 text-sm">
                <Row label="Утас"  value={appt.phone} bold />
                <Row label="И-мэйл" value={appt.email || '-'} bold />
                <Row label="Картын дугаар" value={appt.card_number ? String(appt.card_number) : '-'} bold />
                <Row label="Үйлчлүүлэгчийн төрөл" value={ptypeLabel} bold />
              </div>
            )}

            {leftTab === 'others' && (
              <div className="text-sm text-stone-500 dark:text-stone-400">
                Өнөөдрийн бусад захиалгууд харагдахгүй байна.
              </div>
            )}
          </div>
        </section>

        {/* ── Right pane: 3-step wizard ── */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6">
          {/* Stepper */}
          <div className="flex items-center mb-8">
            <Stepper step={step} setStep={setStep} />
          </div>

          {step === 1 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Эхлэх цаг">
                  <input
                    type="datetime-local"
                    defaultValue={formatDateTimeLocalInput(startIso)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
                <Field label="Салбар">
                  <select
                    defaultValue={appt.branch || 'Төв салбар'}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option>Төв салбар</option>
                  </select>
                </Field>
                <Field label="Эмч">
                  <select
                    defaultValue={appt.doctor_id ?? ''}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={appt.doctor_id ?? ''}>{appt.doctor_name || '—'}</option>
                  </select>
                </Field>
                <Field label="Захиалгын онош">
                  <select
                    defaultValue={
                      ORDER_DIAGNOSIS_OPTIONS.includes(appt.order_diagnosis || '')
                        ? appt.order_diagnosis!
                        : ORDER_DIAGNOSIS_OPTIONS[0]
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {ORDER_DIAGNOSIS_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-6">
                <div className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Анхан давтан эсэх</div>
                <div className="flex flex-wrap items-center gap-5">
                  {VISIT_TYPES.map((v) => (
                    <label key={v.value} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="visit-type"
                        checked={visitType === v.value}
                        onChange={() => setVisitType(v.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-stone-700 dark:text-stone-300">{v.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setStatusValue('arrived'); saveStatus(); }}
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Ирсэн
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-stone-500 dark:text-stone-400 text-sm">
              Эмчилгээний бүртгэл нэмж байгаа болно. (Энд эмчилгээний жагсаалт оруулах боломжтой болно)
            </div>
          )}

          {step === 3 && (
            <div className="text-stone-500 dark:text-stone-400 text-sm">
              Төлбөрийн мэдээлэл бүртгэх хэсэг.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LeftTabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-2 py-2.5 text-[11px] leading-tight font-medium text-center transition-colors border-b-2 -mb-px ${
        active
          ? 'border-primary-600 text-primary-700 dark:text-primary-400'
          : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-stone-500 dark:text-stone-400 shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Stepper({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Цаг захиалга' },
    { n: 2, label: 'Эмчилгээ' },
    { n: 3, label: 'Төлбөр' },
  ];
  return (
    <div className="w-full flex items-center">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <button
            type="button"
            onClick={() => setStep(s.n)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                step >= s.n
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
              }`}
            >
              {s.n}
            </span>
            <span
              className={`text-sm transition-colors ${
                step >= s.n
                  ? 'text-stone-900 font-semibold dark:text-stone-100'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {s.label}
            </span>
          </button>
          {idx < steps.length - 1 && (
            <span
              className={`flex-1 h-px mx-3 ${
                step > s.n ? 'bg-primary-600' : 'bg-stone-200 dark:bg-stone-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
