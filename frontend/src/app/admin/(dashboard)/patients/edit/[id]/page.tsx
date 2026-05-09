'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, QrCode, ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';

const PATIENT_TYPES = [
  { value: 'regular', label: 'Энгийн' },
  { value: 'bronze', label: 'Хүрэл' },
  { value: 'silver', label: 'Мөнгө' },
  { value: 'gold', label: 'Алт' },
];

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState<number | null>(null);

  const [form, setForm] = useState({
    last_name: '',
    first_name: '',
    registry_number: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    phone2: '',
    province: '',
    district: '',
    address: '',
    email: '',
    patient_type: 'regular',
    form_number: '',
    has_allergy: false,
    allergies: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/patients/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          setCardNumber(p.card_number ?? null);
          setForm({
            last_name: p.last_name ?? '',
            first_name: p.first_name ?? '',
            registry_number: p.registry_number ?? '',
            date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
            gender: p.gender ?? '',
            phone: p.phone ?? '',
            phone2: p.phone2 ?? '',
            province: p.province ?? '',
            district: p.district ?? '',
            address: p.address ?? '',
            email: p.email ?? '',
            patient_type: p.patient_type ?? 'regular',
            form_number: p.form_number ?? '',
            has_allergy: p.has_allergy ?? false,
            allergies: p.allergies ?? '',
          });
        }
      } catch {
        setError('Мэдээлэл ачаалж чадсангүй');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function set(key: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'registry_number' && typeof value === 'string' && value.length >= 8) {
        const digits = value.slice(2, 8);
        if (/^\d{6}$/.test(digits)) {
          const yy = parseInt(digits.slice(0, 2), 10);
          const mm = digits.slice(2, 4);
          const dd = digits.slice(4, 6);
          const year = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy;
          const candidate = `${year}-${mm}-${dd}`;
          const parsed = new Date(candidate);
          if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
            next.date_of_birth = candidate;
          }
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/patients');
      } else {
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5';
  const sectionTitleClass = 'text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide';

  if (loading) return <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>;

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/patients/questionnaire/${id}`
    : `/patients/questionnaire/${id}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/patients"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
            >
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Эмчлүүлэгч засах</h2>
              {cardNumber && <span className="text-xs text-stone-500 dark:text-stone-400">Картын дугаар: {cardNumber}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
            <Link href="/admin/patients" className="px-5 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors">
              Буцах
            </Link>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
            >
              <QrCode size={16} /> QR
            </button>
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
          {/* ── Хувийн мэдээлэл ── */}
          <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
            <h3 className={sectionTitleClass}>Хувийн мэдээлэл</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
              <div>
                <label className={labelClass}>Овог <span className="text-red-500">*</span></label>
                <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Нэр <span className="text-red-500">*</span></label>
                <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Регистр</label>
                <input value={form.registry_number} onChange={(e) => set('registry_number', e.target.value.toUpperCase())} placeholder="АА00112233" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Төрсөн огноо</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Хүйс</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                  <option value="">Сонгох</option>
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── Холбоо барих мэдээлэл ── */}
          <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
            <h3 className={sectionTitleClass}>Холбоо барих мэдээлэл</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              <div>
                <label className={labelClass}>Утас <span className="text-red-500">*</span></label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Утас 2</label>
                <input value={form.phone2} onChange={(e) => set('phone2', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Аймаг/хот</label>
                <input value={form.province} onChange={(e) => set('province', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Сум/дүүрэг</label>
                <input value={form.district} onChange={(e) => set('district', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Хаяг</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>И-мэйл</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          {/* ── Нэмэлт ── */}
          <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
            <h3 className={sectionTitleClass}>Нэмэлт</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
              <div>
                <label className={labelClass}>Ангилал</label>
                <select value={form.patient_type} onChange={(e) => set('patient_type', e.target.value)} className={inputClass}>
                  {PATIENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Картын дугаар</label>
                <input value={cardNumber ?? '-'} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <div>
                <label className={labelClass}>Маягт # / Гажиг</label>
                <input value={form.form_number} onChange={(e) => set('form_number', e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_allergy}
                    onChange={(e) => set('has_allergy', e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500 dark:border-stone-600 dark:bg-stone-800"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300">Харшилтай эсэх</span>
                </label>
              </div>
              {form.has_allergy && (
                <div>
                  <label className={labelClass}>Харшлын дэлгэрэнгүй</label>
                  <input value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Пенициллин" className={inputClass} />
                </div>
              )}
            </div>
          </section>
        </div>
      </form>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-1">QR код</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{form.last_name} {form.first_name} — Карт #{cardNumber}</p>

            {/* QR */}
            <div className="flex items-center justify-center bg-white p-6 rounded-xl border border-stone-200 mb-4">
              <div className="w-48 h-48 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  width={192}
                  height={192}
                  className="rounded"
                />
              </div>
            </div>

            {/* Open link */}
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <ExternalLink size={14} /> Холбоос нээх
            </a>

            {/* URL display + copy button */}
            <div className="flex items-stretch gap-2 mb-6">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                <div className="text-[10px] uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-0.5">Линк</div>
                <div className="text-xs text-stone-700 dark:text-stone-300 truncate font-mono" title={qrUrl}>{qrUrl}</div>
              </div>
              <button
                type="button"
                onClick={copyUrl}
                title="Хуулах"
                className="shrink-0 inline-flex items-center justify-center w-10 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </>
  );
}
