'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

const YES_NO_QUESTIONS: { key: string; q: string }[] = [
  { key: 'meds',         q: 'Танд байнга хэрэглэдэг эм тариа бий юу?' },
  { key: 'med_allergy',  q: 'Та ямар нэгэн эм тарианд харшилтай юу?' },
  { key: 'food_allergy', q: 'Хоол хүнс болон бусад зүйлийн харшилтай эсэх?' },
  { key: 'prev_dental',  q: 'Өмнө нь шүдний эмнэлэгт үзүүлж байсан эсэх?' },
  { key: 'anesthesia',   q: 'Шүдний мэдээгүйжүүлэлт хийлгэж байсан эсэх?' },
  { key: 'side_effect',  q: 'Мэдээ алдуулалтаас гаж нөлөө илэрч байсан эсэх?' },
  { key: 'complication', q: 'Та урьд нь шүдний эмчид үзүүлж байхдаа ерөнхий биеийн хүндрэлтэй учирч байсан уу? Ухаан алдах, бие эвгүйрхэх, бөөлжих г.м' },
  { key: 'pregnant',     q: 'Жирэмсэн эсэх?' },
  { key: 'hepatitis',    q: 'Элэгний вирустай эсэх?' },
  { key: 'smoking',      q: 'Тамхи татдаг эсэх?' },
];

const DISEASES = [
  { key: 'heart',     label: 'Зүрхний өвчлөл' },
  { key: 'pressure',  label: 'Цусны даралт ихсэх' },
  { key: 'diabetes',  label: 'Чихрийн шижин' },
  { key: 'kidney',    label: 'Бөөрний өвчин' },
  { key: 'lung',      label: 'Уушгины өвчин' },
  { key: 'liver',     label: 'Элэгний өвчин' },
  { key: 'neuro',     label: 'Мэдрэлийн өвчин' },
  { key: 'cancer',    label: 'Хавдар' },
  { key: 'blood',     label: 'Цус задралын эмгэг' },
];

const GENERAL_OPTIONS = ['Хэвийн', 'Хэвийн бус'];
const MOUTH_OPENING_OPTIONS = ['Чөлөөтэй', 'Хязгаарлагдмал'];

const GENERAL_FIELDS = [
  { key: 'general_state', label: 'Биеийн ерөнхий байдал', options: GENERAL_OPTIONS },
  { key: 'consciousness', label: 'Ухаан санаа',          options: GENERAL_OPTIONS },
  { key: 'skin',          label: 'Арьс салст',           options: GENERAL_OPTIONS },
  { key: 'face_symmetry', label: 'Нүүрний тэгш хэм',     options: GENERAL_OPTIONS },
  { key: 'lymph',         label: 'ЭНО-ын тунгалагийн булчирхай', options: GENERAL_OPTIONS },
  { key: 'mouth_opening', label: 'Ам ангайлт',           options: MOUTH_OPENING_OPTIONS },
];

const ORAL_FIELDS = [
  { key: 'mucosa', label: 'Амны салстын байдал', options: GENERAL_OPTIONS },
  { key: 'tongue', label: 'Хэл',                 options: GENERAL_OPTIONS },
  { key: 'gum',    label: 'Хөвчний байдал',      options: GENERAL_OPTIONS },
];

interface PatientPreview {
  last_name: string;
  first_name: string;
  card_number: number;
  registry_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  phone2?: string | null;
  province?: string | null;
  district?: string | null;
  address?: string | null;
  email?: string | null;
}

const AIMAG_OPTIONS = [
  'Улаанбаатар', 'Архангай', 'Баян-Өлгий', 'Баянхонгор', 'Булган', 'Говь-Алтай',
  'Говьсүмбэр', 'Дархан-Уул', 'Дорноговь', 'Дорнод', 'Дундговь', 'Завхан',
  'Орхон', 'Өвөрхангай', 'Өмнөговь', 'Сүхбаатар', 'Сэлэнгэ', 'Төв',
  'Увс', 'Ховд', 'Хөвсгөл', 'Хэнтий',
];

const UB_DISTRICTS = [
  'Багануур', 'Багахангай', 'Баянгол', 'Баянзүрх', 'Налайх',
  'Сонгинохайрхан', 'Сүхбаатар', 'Хан-Уул', 'Чингэлтэй',
];

export default function QuestionnairePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<PatientPreview | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Yes/No answers — initialize all to 'no'
  const [yesNo, setYesNo] = useState<Record<string, 'yes' | 'no'>>(
    () => Object.fromEntries(YES_NO_QUESTIONS.map((q) => [q.key, 'no'])),
  );
  const [diseases, setDiseases] = useState<Record<string, boolean>>({});
  const [general, setGeneral] = useState<Record<string, string>>(
    () => Object.fromEntries(GENERAL_FIELDS.map((f) => [f.key, f.options[0]])),
  );
  const [oral, setOral] = useState<Record<string, string>>(
    () => Object.fromEntries(ORAL_FIELDS.map((f) => [f.key, f.options[0]])),
  );

  // Personal info — pre-filled from the patient record, all fields editable.
  // Required: name, gender, phone. Other fields are optional.
  const [personal, setPersonal] = useState({
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
  });

  useEffect(() => {
    fetch(`/api/admin/patients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPatient(d.data);
        const p = d.data;
        setPersonal({
          last_name: p.last_name ?? '',
          first_name: p.first_name ?? '',
          registry_number: p.registry_number ?? '',
          date_of_birth: p.date_of_birth ? String(p.date_of_birth).slice(0, 10) : '',
          gender: p.gender ?? '',
          phone: p.phone ?? '',
          phone2: p.phone2 ?? '',
          province: p.province ?? '',
          district: p.district ?? '',
          address: p.address ?? '',
          email: p.email ?? '',
        });
      })
      .catch(() => {});
  }, [id]);

  function setP<K extends keyof typeof personal>(key: K, value: (typeof personal)[K]) {
    setPersonal((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Future: POST to API. For now, mark as submitted.
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <TopBar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Баярлалаа!</h1>
            <p className="text-stone-600">Таны асуумжийг хүлээн авлаа. Та эмчтэйгээ уулзах боломжтой боллоо.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <TopBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Эмчилгээний асуумж</h1>
          {patient && (
            <p className="text-stone-600 mt-2">
              <span className="font-medium text-stone-900">{patient.last_name} {patient.first_name}</span>
              <span className="text-stone-500"> · Карт #{patient.card_number}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal info — confirm or update */}
          <Section
            title="Хувийн мэдээлэл"
            subtitle="Шаардлагатай тохиолдолд мэдээллээ шинэчилнэ үү"
            accent
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Овог">
                <input
                  type="text"
                  value={personal.last_name}
                  onChange={(e) => setP('last_name', e.target.value)}
                  className={qInputClass}
                />
              </Field>
              <Field label="Нэр" required>
                <input
                  type="text"
                  value={personal.first_name}
                  onChange={(e) => setP('first_name', e.target.value)}
                  className={qInputClass}
                  required
                />
              </Field>
              <Field label="Регистр">
                <input
                  type="text"
                  value={personal.registry_number}
                  onChange={(e) => setP('registry_number', e.target.value.toUpperCase())}
                  className={`${qInputClass} font-mono`}
                  placeholder="АА00000000"
                />
              </Field>
              <Field label="Төрсөн огноо">
                <input
                  type="date"
                  value={personal.date_of_birth}
                  onChange={(e) => setP('date_of_birth', e.target.value)}
                  className={qInputClass}
                />
              </Field>
              <Field label="Хүйс" required>
                <div className="flex items-center gap-5 pt-1">
                  <RadioOption
                    checked={personal.gender === 'male'}
                    onChange={() => setP('gender', 'male')}
                    label="Эрэгтэй"
                  />
                  <RadioOption
                    checked={personal.gender === 'female'}
                    onChange={() => setP('gender', 'female')}
                    label="Эмэгтэй"
                  />
                </div>
              </Field>
              <Field label="Утас" required>
                <input
                  type="tel"
                  value={personal.phone}
                  onChange={(e) => setP('phone', e.target.value)}
                  className={qInputClass}
                  required
                />
              </Field>
              <Field label="Утас 2">
                <input
                  type="tel"
                  value={personal.phone2}
                  onChange={(e) => setP('phone2', e.target.value)}
                  className={qInputClass}
                />
              </Field>
              <Field label="Аймаг/Хот">
                <select
                  value={personal.province}
                  onChange={(e) => {
                    setP('province', e.target.value);
                    // Reset district if province changed away from УБ
                    if (e.target.value !== 'Улаанбаатар') setP('district', '');
                  }}
                  className={qInputClass}
                >
                  <option value="">Сонгох</option>
                  {AIMAG_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Сум/Дүүрэг">
                {personal.province === 'Улаанбаатар' ? (
                  <select
                    value={personal.district}
                    onChange={(e) => setP('district', e.target.value)}
                    className={qInputClass}
                  >
                    <option value="">Сум/Дүүрэг</option>
                    {UB_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={personal.district}
                    onChange={(e) => setP('district', e.target.value)}
                    className={qInputClass}
                    placeholder="Сум/Дүүрэг"
                  />
                )}
              </Field>
              <Field label="Хаяг">
                <input
                  type="text"
                  value={personal.address}
                  onChange={(e) => setP('address', e.target.value)}
                  className={qInputClass}
                />
              </Field>
              <Field label="И-мэйл">
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setP('email', e.target.value)}
                  className={qInputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Yes/No section */}
          <Section title="Өөрт хамаатайг сонгоно уу">
            <div className="divide-y divide-stone-100">
              {YES_NO_QUESTIONS.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 py-3.5">
                  <span className="text-sm text-stone-800 flex-1 leading-relaxed">{item.q}</span>
                  <div className="flex gap-2 shrink-0">
                    <RadioPill
                      checked={yesNo[item.key] === 'yes'}
                      onChange={() => setYesNo((s) => ({ ...s, [item.key]: 'yes' }))}
                      label="Тийм"
                      tone="yes"
                    />
                    <RadioPill
                      checked={yesNo[item.key] === 'no'}
                      onChange={() => setYesNo((s) => ({ ...s, [item.key]: 'no' }))}
                      label="Үгүй"
                      tone="no"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Diseases */}
          <Section title="Дараах өвчин эмгэгүүд бий юу?" subtitle="Хамаарах бүхнийг сонгоно уу">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DISEASES.map((d) => {
                const checked = !!diseases[d.key];
                return (
                  <label
                    key={d.key}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setDiseases((s) => ({ ...s, [d.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-stone-800">{d.label}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* General body exam */}
          <Section title="Биеийн ерөнхий байдал">
            <div className="space-y-3">
              {GENERAL_FIELDS.map((f) => (
                <SegmentedRow
                  key={f.key}
                  label={f.label}
                  options={f.options}
                  value={general[f.key]}
                  onChange={(v) => setGeneral((s) => ({ ...s, [f.key]: v }))}
                />
              ))}
            </div>
          </Section>

          {/* Oral exam */}
          <Section title="Амны хөндийн үзлэг">
            <div className="space-y-3">
              {ORAL_FIELDS.map((f) => (
                <SegmentedRow
                  key={f.key}
                  label={f.label}
                  options={f.options}
                  value={oral[f.key]}
                  onChange={(v) => setOral((s) => ({ ...s, [f.key]: v }))}
                />
              ))}
            </div>
          </Section>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              Илгээх
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Image
          src="/images/logo/logo-dark.png"
          alt="Sayan Dent"
          width={140}
          height={32}
          className="h-8 w-auto"
          priority
        />
      </div>
    </header>
  );
}

function Section({ title, subtitle, accent = false, children }: { title: string; subtitle?: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
      <h2 className={`text-base font-semibold ${accent ? 'text-primary-700' : 'text-stone-900'}`}>{title}</h2>
      {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const qInputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function RadioOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-stone-800">
      <span
        onClick={onChange}
        role="radio"
        aria-checked={checked}
        className={`relative inline-block w-4 h-4 rounded-full border transition-colors ${
          checked ? 'border-primary-600' : 'border-stone-300'
        }`}
      >
        {checked && (
          <span className="absolute inset-0.5 rounded-full bg-primary-600" />
        )}
      </span>
      <span onClick={onChange}>{label}</span>
    </label>
  );
}

function RadioPill({ checked, onChange, label, tone }: { checked: boolean; onChange: () => void; label: string; tone: 'yes' | 'no' }) {
  const activeClass = tone === 'yes'
    ? 'bg-red-600 text-white border-red-600'
    : 'bg-emerald-600 text-white border-emerald-600';
  const inactiveClass = 'bg-white text-stone-600 border-stone-200 hover:border-stone-300';
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${checked ? activeClass : inactiveClass}`}
    >
      {label}
    </button>
  );
}

function SegmentedRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <span className="text-sm text-stone-700">{label}</span>
      <div className="flex gap-1 p-1 rounded-lg bg-stone-100">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              value === opt
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
