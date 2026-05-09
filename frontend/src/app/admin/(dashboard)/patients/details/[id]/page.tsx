'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Printer,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User as UserIcon,
  IdCard,
} from 'lucide-react';
import ToothChart, { DiagnosisLegend, useToothMarks } from '@/components/admin/ToothChart';

interface Patient {
  id: string;
  card_number: number;
  last_name: string;
  first_name: string;
  date_of_birth: string | null;
  registry_number: string | null;
  gender: string | null;
  phone: string;
  phone2: string | null;
  province: string | null;
  district: string | null;
  address: string | null;
  email: string | null;
  has_allergy: boolean;
  allergies: string | null;
  patient_type: string;
}

const GENDER_LABELS: Record<string, string> = { male: 'Эрэгтэй', female: 'Эмэгтэй' };

const PATIENT_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  regular: { label: 'Энгийн', className: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
  bronze:  { label: 'Хүрэл',  className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  silver:  { label: 'Мөнгө',  className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  gold:    { label: 'Алт',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
};

function formatDate(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function calcAge(iso: string | null) {
  if (!iso) return '-';
  const birth = new Date(iso);
  const now = new Date();
  let a = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) a--;
  return a;
}

type ChartTab = 'permanent' | 'primary' | 'initial' | 'questionnaire';
type HistoryTab = 'treatment' | 'by_tooth' | 'xray' | 'payment' | 'credit';

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>('permanent');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('treatment');

  const permanentMarks = useToothMarks();
  const primaryMarks = useToothMarks();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/patients/${id}`);
        const data = await res.json();
        if (data.success) setPatient(data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>;
  if (!patient) return <div className="text-stone-500 dark:text-stone-400">Эмчлүүлэгч олдсонгүй</div>;

  const fullAddress = [patient.province, patient.district, patient.address].filter(Boolean).join(', ') || '-';
  const typeStyle = PATIENT_TYPE_STYLES[patient.patient_type] ?? { label: patient.patient_type, className: '' };

  const activeMarks = chartTab === 'permanent' ? permanentMarks : primaryMarks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/patients"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <ChevronLeft size={18} />
          </Link>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Эмчлүүлэгчийн карт</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/patients/edit/${patient.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            <Pencil size={16} /> Засах
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Printer size={16} /> Хэвлэх
          </button>
        </div>
      </div>

      {/* Patient card */}
      <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar / monogram */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {patient.last_name.charAt(0)}{patient.first_name.charAt(0)}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-50">{patient.last_name} {patient.first_name}</h3>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle.className}`}>{typeStyle.label}</span>
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
              <IdCard size={14} /> Картын дугаар: <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{patient.card_number}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 mt-5">
              <Field icon={<IdCard size={14} />} label="Регистр" value={patient.registry_number || '-'} mono />
              <Field icon={<UserIcon size={14} />} label="Хүйс" value={patient.gender ? GENDER_LABELS[patient.gender] || patient.gender : '-'} />
              <Field icon={<Calendar size={14} />} label="Төрсөн огноо" value={formatDate(patient.date_of_birth)} />
              <Field icon={<Calendar size={14} />} label="Нас" value={String(calcAge(patient.date_of_birth))} />
              <Field icon={<Phone size={14} />} label="Утас" value={patient.phone} />
              <Field icon={<Phone size={14} />} label="Утас 2" value={patient.phone2 || '-'} />
              <Field icon={<Mail size={14} />} label="И-мэйл" value={patient.email || '-'} />
              <Field icon={<MapPin size={14} />} label="Хаяг" value={fullAddress} />
            </div>

            {patient.has_allergy && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50">
                <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-0.5">Харшилтай</div>
                <div className="text-sm text-red-900 dark:text-red-200">{patient.allergies || 'Тийм'}</div>
              </div>
            )}

            {/* Subtle stats — below contact info, after a separator */}
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <InlineStat label="Нийт цаг захиалга" value="1" />
                <InlineStat label="Үзүүлсэн тоо" value="1" />
                <InlineStat label="Цуцалсан тоо" value="0" muted />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chart tabs */}
      <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="flex border-b border-stone-200 dark:border-stone-800">
          <ChartTabBtn active={chartTab === 'permanent'}     onClick={() => setChartTab('permanent')}>Байнгын шүд</ChartTabBtn>
          <ChartTabBtn active={chartTab === 'primary'}       onClick={() => setChartTab('primary')}>Сүүн шүд</ChartTabBtn>
          <ChartTabBtn active={chartTab === 'initial'}       onClick={() => setChartTab('initial')}>Анхан шатны үзлэг</ChartTabBtn>
          <ChartTabBtn active={chartTab === 'questionnaire'} onClick={() => setChartTab('questionnaire')}>Асуумж</ChartTabBtn>
        </div>

        <div className="p-6">
          {(chartTab === 'permanent' || chartTab === 'primary') && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <ToothChart
                  type={chartTab === 'permanent' ? 'permanent' : 'primary'}
                  marks={activeMarks.marks}
                  onSurfaceClick={activeMarks.handleSurfaceClick}
                />
              </div>
              <DiagnosisLegend
                selected={activeMarks.activeColor?.key}
                onSelect={(key, color) => activeMarks.setActiveColor({ key, color })}
              />
              {activeMarks.activeColor && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Идэвхтэй өнгө сонгогдсон. Шүдний гадаргуу дээр дарж тэмдэглэгээ хийнэ үү.
                </p>
              )}
            </div>
          )}

          {chartTab === 'initial' && (
            <div className="text-stone-500 dark:text-stone-400 text-sm">Анхан шатны үзлэгийн мэдээлэл бүртгэгдээгүй байна.</div>
          )}
          {chartTab === 'questionnaire' && (
            <div>
              <div className="flex justify-end mb-4">
                <Link
                  href={`/patients/questionnaire/${id}`}
                  target="_blank"
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
                >
                  Эмчлүүлэгчид зориулсан асуумж нээх →
                </Link>
              </div>
              <Questionnaire />
            </div>
          )}
        </div>
      </section>

      {/* History tabs */}
      <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
          <ChartTabBtn active={historyTab === 'treatment'} onClick={() => setHistoryTab('treatment')}>Эмчилгээний түүх</ChartTabBtn>
          <ChartTabBtn active={historyTab === 'by_tooth'}  onClick={() => setHistoryTab('by_tooth')}>Шүдээр</ChartTabBtn>
          <ChartTabBtn active={historyTab === 'xray'}      onClick={() => setHistoryTab('xray')}>Шүдний зураг</ChartTabBtn>
          <ChartTabBtn active={historyTab === 'payment'}   onClick={() => setHistoryTab('payment')}>Төлбөрийн түүх</ChartTabBtn>
          <ChartTabBtn active={historyTab === 'credit'}    onClick={() => setHistoryTab('credit')}>Зээлийн түүх</ChartTabBtn>
        </div>

        <div className="p-6 text-stone-500 dark:text-stone-400 text-sm">
          {historyTab === 'treatment' && 'Эмчилгээний түүх бүртгэгдээгүй байна.'}
          {historyTab === 'by_tooth'  && 'Шүдээр харах түүх байхгүй байна.'}
          {historyTab === 'xray'      && 'Шүдний зураг олдсонгүй.'}
          {historyTab === 'payment'   && 'Төлбөрийн түүх олдсонгүй.'}
          {historyTab === 'credit'    && 'Зээлийн түүх олдсонгүй.'}
        </div>
      </section>
    </div>
  );
}

function Field({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-0.5">
        {icon} {label}
      </div>
      <div className={`text-sm text-stone-900 dark:text-stone-100 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function InlineStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-stone-500 dark:text-stone-400">{label}:</span>
      <span className={`font-mono text-sm font-semibold ${
        muted
          ? 'text-stone-500 dark:text-stone-400'
          : 'text-stone-900 dark:text-stone-100'
      }`}>{value}</span>
    </div>
  );
}

function ChartTabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
        active
          ? 'border-primary-600 text-primary-700 dark:text-primary-400'
          : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
      }`}
    >
      {children}
    </button>
  );
}

// ────────── Questionnaire ──────────
const YES_NO_QUESTIONS: { q: string; a: string }[] = [
  { q: 'Танд байнга хэрэглэдэг эм тариа бий юу?', a: 'Үгүй' },
  { q: 'Та ямар нэгэн эм тарианд харшилтай юу?', a: 'Үгүй' },
  { q: 'Хоол хүнс болон бусад зүйлийн харшилтай эсэх?', a: 'Үгүй' },
  { q: 'Өмнө нь шүдний эмнэлэгт үзүүлж байсан эсэх?', a: 'Үгүй' },
  { q: 'Шүдний мэдээгүйжүүлэлт хийлгэж байсан эсэх?', a: 'Үгүй' },
  { q: 'Мэдээ алдуулалтаас гаж нөлөө илэрч байсан эсэх?', a: 'Үгүй' },
  { q: 'Та урьд нь шүдний эмчид үзүүлж байхдаа ерөнхий биеийн хүндрэлтэй учирч байсан уу? Ухаан алдах, бие эвгүйрхэх, бөөлжих г.м', a: 'Үгүй' },
  { q: 'Жирэмсэн эсэх?', a: 'Үгүй' },
  { q: 'Элэгний вирустай эсэх?', a: 'Үгүй' },
  { q: 'Тамхи татдаг эсэх?', a: 'Үгүй' },
];

const DISEASES = [
  'Зүрхний өвчлөл',
  'Цусны даралт ихсэх',
  'Чихрийн шижин',
  'Бөөрний өвчин',
  'Уушгины өвчин',
  'Элэгний өвчин',
  'Мэдрэлийн өвчин',
  'Хавдар',
  'Цус задралын эмгэг',
];

const GENERAL_EXAM: { label: string; value: string }[] = [
  { label: 'Биеийн ерөнхий байдал', value: 'Хэвийн' },
  { label: 'Ухаан санаа', value: 'Хэвийн' },
  { label: 'Арьс салст', value: 'Хэвийн' },
  { label: 'Нүүрний тэгш хэм', value: 'Хэвийн' },
  { label: 'ЭНО-ын тунгалагийн булчирхай', value: 'Хэвийн' },
  { label: 'Ам ангайлт', value: 'Чөлөөтэй' },
];

const ORAL_EXAM: { label: string; value: string }[] = [
  { label: 'Амны салстын байдал', value: 'Хэвийн' },
  { label: 'Хэл', value: 'Хэвийн' },
  { label: 'Хөвчний байдал', value: 'Хэвийн' },
];

function Questionnaire() {
  return (
    <div className="space-y-8">
      {/* Yes/No section */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">Өөрт хамаатайг сонгоно уу</h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">Эмчлүүлэгчийн өгсөн хариултууд</p>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          {YES_NO_QUESTIONS.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-4 px-4 py-3 bg-white dark:bg-stone-900">
              <span className="text-sm text-stone-700 dark:text-stone-300 flex-1">{item.q}</span>
              <YesNoBadge value={item.a} />
            </div>
          ))}
        </div>
      </div>

      {/* Disease checklist */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">Дараах өвчин эмгэгүүд бий юу?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DISEASES.map((d) => (
            <div key={d} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
              <span className="text-sm text-stone-700 dark:text-stone-300">{d}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">—</span>
            </div>
          ))}
        </div>
      </div>

      {/* General body exam */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">Биеийн ерөнхий байдал</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {GENERAL_EXAM.map((row) => <ExamRow key={row.label} {...row} />)}
        </div>
      </div>

      {/* Oral exam */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">Амны хөндийн үзлэг</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ORAL_EXAM.map((row) => <ExamRow key={row.label} {...row} />)}
        </div>
      </div>
    </div>
  );
}

function YesNoBadge({ value }: { value: string }) {
  const isYes = value.toLowerCase() === 'тийм';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
      isYes
        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    }`}>
      {value}
    </span>
  );
}

function ExamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
      <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{value}</span>
    </div>
  );
}
