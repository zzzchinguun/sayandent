'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// ── Онош (ICD Dental Codes) ──
const DIAGNOSES = [
  { code: 'К00', name: 'Шүдний хөгжил ба шүдлэхүйн хямрал' },
  { code: 'К01', name: 'Саатсан ба хоригдмол шүд' },
  { code: 'К02', name: 'Шүд цоорох (Кариес)' },
  { code: 'К02.1', name: 'Тугалмайн цоорол' },
  { code: 'К02.2', name: 'Ясжмагийн цоорол' },
  { code: 'К02.3', name: 'Шүдгүй зогсонги цоорол' },
  { code: 'К02.4', name: 'Одонтоклази /хүүхдийн меланоденти, меланодонтоклази/' },
  { code: 'К02.8', name: 'Шүдний бусад цоорол' },
  { code: 'К02.9', name: 'Шүдний цоорол тодорхойгүй' },
  { code: 'К03', name: 'Шүдний хатуу эдийн бусад өвчин' },
  { code: 'К03.0', name: 'Шүдний хэт элэгдэх /шүдний түшилцэх ба хорших гадаргуу/' },
  { code: 'К03.1', name: 'Шүд зүлгэгдэх /шүдний 00, зуршлаас, ажил мэргэжлээс, зан үйл уламжлалаас/' },
  { code: 'К03.2', name: 'Шүдний шалбархай /хоол унд, эм бэлдмэлээс, байнга бөөлжих, шалтгаан тодорхойгүй, мэргэжлийн/' },
  { code: 'К03.3', name: 'Шүд эмгэгээр шимэгдэх /шүдний зөөлцийн гранулом, шүд шимэгдэх/' },
  { code: 'К03.4', name: 'Гиперцементоз /шохойжсон ясжмаг/' },
  { code: 'К03.5', name: 'Шүдний орой хэсгийн архаг периодонтит' },
  { code: 'К04', name: 'Шүдний зөөлц ба сурвалжийн орой тойрны эдийн өвчин' },
  { code: 'К04.6', name: 'Сурвалжийн орой тойрны хөндийт буглаа' },
  { code: 'К04.7', name: 'Сурвалжийн орой тойрны хөндийгүй буглаа' },
  { code: 'К04.8', name: 'Сурвалжийн уйланхай' },
  { code: 'К04.9', name: 'Зөөлц ба сурвалжийн орой тойрны эдийн бусад ба тодорхойгүй өвчин' },
  { code: 'К05', name: 'Гингивит ба шүдний эргэн тойрны элдийн өвчин' },
  { code: 'К05.0', name: 'Цочмог гингивит' },
  { code: 'К05.1', name: 'Архаг гингивит' },
  { code: 'К05.2', name: 'Цочмог парадонтит' },
  { code: 'К05.3', name: 'Архаг парадонтит' },
  { code: 'К05.4', name: 'Парадонтоз /өсвөр үеийн парадонтоз/' },
  { code: 'К05.5', name: 'Шүд тойрон эдийн бусад өвчин' },
  { code: 'К05.6', name: 'Шүд тойрон эдийн өвчин тодорхойгүй' },
  { code: 'К06', name: 'Буйл ба шүдний түүшний эрмэгний бусад эмгэг' },
  { code: 'К06.0', name: 'Буйл шуугдах' },
  { code: 'К06.1', name: 'Буйлны гипертрофи' },
  { code: 'К06.2', name: 'Гэмтлийн гаралтай буйл ба шүдгүй түүшийн эрмэгийн эмгэг' },
  { code: 'К07', name: 'Эрүү нүүрний гажиг' },
  { code: 'К08', name: 'Шүд ба түүний тулгуур аппаратын бусад эмгэг' },
  { code: 'К08.1', name: 'Осол, шүд авах буюу шүдний холбоос эдийн байршмал өвчнөөс улбаалж шүдгүй болох' },
  { code: 'К08.1А', name: 'Хоншоорын хэсэгчилсэн шүдгүйдэл' },
  { code: 'К08.1В', name: 'Доод эрүүний хэсэгчилсэн шүдгүйдэл' },
  { code: 'К08.1AF', name: 'Хоншоорын хэсэгчилсэн уян шүдэлбэр' },
  { code: 'К08.1BF', name: 'Доод эрүүний хэсэгчилсэн уян шүдэлбэр' },
  { code: 'К08.2', name: 'Шүдгүй түүшийн эрмэгийн хатингаршил' },
  { code: 'К08.2/С/', name: 'Хоншоорын бүрэн шүдгүйдэл' },
  { code: 'К08.2/D/', name: 'Доод эрүүний бүрэн шүдгүйдэл' },
  { code: 'К08.3', name: 'Шүдний ёзоор саатах' },
  { code: 'К08.8', name: 'Шүд ба түүний тулгуур аппаратын бусад тодорхой эмгэг' },
  { code: 'К08.9', name: 'Шүд ба түүний тулгуур аппаратын бусад тодорхой эмгэг тодорхойгүй' },
  { code: 'К09', name: 'Өөр бүлэгт ангилаагүй ам орчимын уйланхай' },
  { code: 'К10', name: 'Эрүүний бусад өвчин' },
  { code: 'К11', name: 'Шүлсний булчирхайн өвчин' },
  { code: 'К11.0', name: 'Шүлсний булчирхайн хатингаршил' },
  { code: 'К11.1', name: 'Шүлсний булчирхайн гипертрофи' },
  { code: 'К11.2', name: 'Сиаладенит' },
  { code: 'К11.3', name: 'Шүлсний булчирхайн буглаа' },
  { code: 'К11.4', name: 'Шүлсний булчирхайн цорго' },
  { code: 'К11.5', name: 'Сиалолтиаз /Шүлсний булчирхай буюу .../' },
  { code: 'К11.6', name: 'Шүлсний булчирхайн мукоцеле' },
  { code: 'К11.7', name: 'Шүлсний булчирхайн шүүрэл хямрах' },
  { code: 'К11.8', name: 'Шүлсний булчирхайн бусад өвчин' },
  { code: 'К11.9', name: 'Шүлсний булчирхайн өвчин, тодорхойгүй' },
  { code: 'К12', name: 'Стоматит ба түүнд хамаарах гэмтэц' },
  { code: 'К12.0', name: 'Амны дахилтат афт шархлаа' },
  { code: 'К12.1', name: 'Стоматитын бусад хэлбэр' },
  { code: 'К12.2', name: 'Ам орчмын буглаа ба целлюлит' },
  { code: 'К13', name: 'Уруул ба амны салст бүрхүүлийн бусад өвчин' },
  { code: 'К13.0', name: 'Уруулын өвчин' },
  { code: 'К13.1', name: 'Хацар ба уруулаа хазах' },
  { code: 'К13.2', name: 'Лейкоплаки ба амны хөндийн хучуур эдийн эмгэг' },
  { code: 'К13.3', name: 'Үсэрхэг лейкоплаки' },
  { code: 'К14', name: 'Хэлний өний паалангийн цоорол' },
  { code: 'К14.7', name: 'Хэлний бусад өвчин' },
  { code: 'К14.9', name: 'Хэлний өвчин, тодорхойгүй' },
];

// ── Эмчилгээ (Treatments) ──
const TREATMENTS = [
  { name: 'Өнгөц цоорлын эмчилгээ (Том хүн-A)', price: 65000, material: 'Өнгөц цоорлын эмчилгээ (Том хүн-A)' },
  { name: 'Мэдээ алдуулах тариа', price: 10000, material: 'Мэдээ алдуулах тариа' },
  { name: 'Гажиг засал /Зай баригч/ 2талдаа', price: 180000, material: 'Гажиг засал /Зай баригч/ 2талдаа' },
  { name: 'metapex+гэрлийн ломбо', price: 59000, material: 'metapex+гэрлийн ломбо' },
  { name: 'Airflow (Бүх шүдний өнгөр чулуу цэвэрлэгээ)', price: 150000, material: 'Airflow' },
  { name: 'Шүдний сувгийн голонцортой ломбо (Том хүн)', price: 95000, material: 'Шүдний сувгийн голонцортой ломбо (Том хүн)' },
  { name: 'Мэдээ алдуулалт (4%)', price: 12000, material: 'Мэдээ алдуулалт (4%)' },
  { name: 'Фтортой ломбо', price: 65000, material: 'Фтортой ломбо' },
  { name: 'Caryson+Adhesor+Дентин', price: 45000, material: 'Caryson+Adhesor+Дентин' },
  { name: 'Шүдний сувгийн ломбо (Том хүн-1)', price: 50000, material: 'Шүдний сувгийн ломбо (Том хүн-1)' },
  { name: 'Шүд эрдэсжүүлэх Фторт түрхлэг', price: 25000, material: 'Шүд эрдэсжүүлэх Фторт түрхлэг' },
  { name: 'Дунд цоорол (Хүүхэд)', price: 45000, material: 'Дунд цоорол (Хүүхэд)' },
  { name: 'Гүн цоорол (Хүүхэд)', price: 55000, material: 'Гүн цоорол (Хүүхэд)' },
  { name: 'Caryson+Adhesor+Дентин (Хүүхэд)', price: 30000, material: 'Caryson+Adhesor+Дентин' },
  { name: 'Ховил битүүлэх ломбо (Fissurit-1 шүдний)', price: 25000, material: 'Ховил битүүлэх ломбо (Fissurit-1 шүдний)' },
  { name: 'Дентин', price: 20000, material: 'Дентин' },
  { name: 'Мышъяк + дентин', price: 45000, material: 'Мышъяк + дентин' },
  { name: 'Шүд цайруулалт 35%', price: 200000, material: 'Шүд цайруулалт' },
  { name: 'Буйл тайрах (1 шүдний)', price: 35000, material: 'Буйл тайрах (1 шүдний)' },
  { name: 'Хүүхдийн сувгийн эмчилгээ-1', price: 48500, material: 'Хүүхдийн сувгийн эмчилгээ-1' },
  { name: 'Хүүхдийн сувгийн ломбо', price: 48000, material: 'Хүүхдийн сувгийн ломбо' },
  { name: 'Хүүхдийн сувгийн эм солилт', price: 20000, material: 'Хүүхдийн сувгийн эм солилт' },
  { name: 'Мышъяк + дентин (Хүүхэд)', price: 39000, material: 'Мышъяк + дентин' },
  { name: 'Гажиг засал- 1 Брекет наах', price: 20000, material: 'Гажиг засал- 1 Брекет наах' },
  { name: 'Гажиг засал- Банд наах', price: 20000, material: 'Гажиг засал- Банд наах' },
  { name: 'Retainer (Ретайнер-2талдаа)', price: 250000, material: 'Retainer (Ретайнер-2талдаа)' },
  { name: 'Retainer (Ретайнер-1талдаа)', price: 160000, material: 'Retainer (Ретайнер-1талдаа)' },
  { name: 'Гажиг засал /Зай баригч/ 1талдаа', price: 90000, material: 'Гажиг засал /Зай баригч/ 1талдаа' },
  { name: 'Рентген зураг (1 шүдний)', price: 15000, material: 'Рентген зураг (1 шүдний)' },
  { name: 'Calcimol+Дентин', price: 45000, material: 'Calcimol+Дентин' },
  { name: 'Шүд цонхлох (Буйл нээх)', price: 70000, material: 'Шүд цонхлох (Буйл нээх)' },
  { name: 'Чиг тавих', price: 40000, material: 'Чиг тавих' },
  { name: 'Сурвалж орой тайралт', price: 200000, material: 'Сурвалж орой тайралт' },
  { name: 'Шүд угаалт', price: 20000, material: 'Шүд угаалт' },
  { name: 'Уян шүдэлбэр', price: 80000, material: 'Уян шүдэлбэр' },
  { name: 'Уян шүдэлбэр 1ш', price: 5500, material: 'Уян шүдэлбэр' },
  { name: 'Хатуу хуванцар шүдэлбэр', price: 65000, material: 'Хатуу хуванцар шүдэлбэр' },
  { name: 'Хатуу хуванцар шүдэлбэр 1ш', price: 6500, material: 'Хатуу хуванцар шүдэлбэр' },
  { name: 'Hollywood Smile (Паалан - 1 шүдний)', price: 120000, material: 'Ultradent Opaque' },
  { name: 'Циркон бүрээс', price: 750000, material: 'Циркон бүрээс' },
  { name: 'Уурхайн', price: 150000, material: 'Уурхайн' },
  { name: 'Гүн цоорлын эмчилгээ (Том хүн-С)', price: 90000, material: 'Eviclar' },
  { name: 'BioRoot', price: 160000, material: 'BioRoot' },
  { name: 'COAT', price: 30000, material: 'Эмчилгээ' },
];

function formatPrice(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

type Tab = 'diagnosis' | 'treatment';

export default function TreatmentsPage() {
  const [tab, setTab] = useState<Tab>('diagnosis');
  const [search, setSearch] = useState('');

  const filteredDiagnoses = useMemo(() => {
    if (!search) return DIAGNOSES;
    const q = search.toLowerCase();
    return DIAGNOSES.filter((d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
  }, [search]);

  const filteredTreatments = useMemo(() => {
    if (!search) return TREATMENTS;
    const q = search.toLowerCase();
    return TREATMENTS.filter((t) => t.name.toLowerCase().includes(q) || t.material.toLowerCase().includes(q));
  }, [search]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Эмчилгээ</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хайх..."
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab('diagnosis')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'diagnosis'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
        >
          Онош <span className="ml-1 opacity-70">{filteredDiagnoses.length}</span>
        </button>
        <button
          onClick={() => setTab('treatment')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'treatment'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
        >
          Эмчилгээ <span className="ml-1 opacity-70">{filteredTreatments.length}</span>
        </button>
      </div>

      {/* Онош Table */}
      {tab === 'diagnosis' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-28">Код</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Нэр</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredDiagnoses.map((d) => {
                const isParent = !d.code.includes('.');
                return (
                  <tr key={d.code} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className={`px-4 py-2.5 font-mono text-xs ${isParent ? 'font-bold text-primary-700 dark:text-primary-400' : 'text-stone-500 dark:text-stone-400 pl-8'}`}>
                      {d.code}
                    </td>
                    <td className={`px-4 py-2.5 ${isParent ? 'font-medium text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                      {d.code} - {d.name}
                    </td>
                  </tr>
                );
              })}
              {filteredDiagnoses.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">Олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Эмчилгээ Table */}
      {tab === 'treatment' && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Нэр</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-32">Төлбөр</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Эмчилгээний материал</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredTreatments.map((t, i) => (
                <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="px-4 py-2.5 font-medium text-stone-900 dark:text-stone-100">{t.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-stone-700 dark:text-stone-300">{formatPrice(t.price)}</td>
                  <td className="px-4 py-2.5 text-stone-600 dark:text-stone-400">{t.material}</td>
                </tr>
              ))}
              {filteredTreatments.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">Олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      <div className="flex justify-end mt-4">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          Нийт: {tab === 'diagnosis' ? filteredDiagnoses.length : filteredTreatments.length}
        </span>
      </div>
    </div>
  );
}
