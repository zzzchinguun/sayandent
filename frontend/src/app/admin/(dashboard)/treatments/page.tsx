'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { DIAGNOSES, TREATMENTS } from '@/lib/dental/codes';



function formatPrice(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

type Tab = 'diagnosis' | 'treatment';

export default function TreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = use(searchParams);
  const [tab, setTab] = useState<Tab>(tabParam === 'treatment' ? 'treatment' : 'diagnosis');
  const [search, setSearch] = useState('');

  // Sidebar links navigate to this same page with a different ?tab= — keep in sync.
  useEffect(() => {
    setTab(tabParam === 'treatment' ? 'treatment' : 'diagnosis');
  }, [tabParam]);

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
