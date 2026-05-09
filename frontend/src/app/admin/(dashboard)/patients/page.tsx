'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  card_number: number;
  last_name: string;
  first_name: string;
  date_of_birth: string | null;
  registry_number: string | null;
  gender: string | null;
  phone: string;
  has_allergy: boolean;
  patient_type: string;
  payment_status: string;
}

const PAGE_SIZE = 10;

const GENDER_LABELS: Record<string, string> = { male: 'Эрэгтэй', female: 'Эмэгтэй' };

const PATIENT_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  regular: { label: 'Энгийн', className: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
  bronze:  { label: 'Хүрэл',  className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  silver:  { label: 'Мөнгө',  className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  gold:    { label: 'Алт',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
};

const PATIENT_TYPE_OPTIONS = [
  { value: 'all', label: 'Бүгд' },
  { value: 'regular', label: 'Энгийн' },
  { value: 'bronze', label: 'Хүрэл' },
  { value: 'silver', label: 'Мөнгө' },
  { value: 'gold', label: 'Алт' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Бүгд' },
  { value: 'paid', label: 'Төлсөн' },
  { value: 'unpaid', label: 'Төлөөгүй' },
];

function formatDate(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number; flipUp: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenuForRow = (id: string, rowEl: HTMLElement) => {
    const MENU_W = 160;
    const MENU_H = 132; // approx height (3 items * 44px)
    const rect = rowEl.getBoundingClientRect();
    const flipUp = rect.bottom + MENU_H + 8 > window.innerHeight;
    const x = Math.max(8, Math.min(window.innerWidth - MENU_W - 8, rect.right - MENU_W));
    const y = flipUp ? rect.top - MENU_H - 4 : rect.bottom + 4;
    setMenu({ id, x, y, flipUp });
  };

  // Close menu on outside click, scroll, or resize
  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    const close = () => setMenu(null);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const deletePatient = async (id: string) => {
    if (!confirm('Энэ эмчлүүлэгчийг устгах уу?')) return;
    await fetch(`/api/admin/patients/${id}`, { method: 'DELETE' });
    setMenu(null);
    fetchPatients();
  };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/patients');
    const data = await res.json();
    setPatients(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      if (typeFilter !== 'all' && p.patient_type !== typeFilter) return false;
      if (paymentFilter !== 'all' && p.payment_status !== paymentFilter) return false;
      if (q && !(
        p.last_name.toLowerCase().includes(q) ||
        p.first_name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.registry_number?.toLowerCase().includes(q)) ||
        String(p.card_number).includes(q)
      )) return false;
      return true;
    });
  }, [patients, typeFilter, paymentFilter, search]);

  // Reset to page 1 when filters/search change
  useEffect(() => { setPage(1); }, [typeFilter, paymentFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectClass = 'px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Эмчлүүлэгчид</h2>
        <div className="flex items-center gap-3">
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
          <Link href="/admin/patients/new" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
            <Plus size={16} />
            Нэмэх
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>
      ) : (
        <>
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Овог</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Нэр</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Төрсөн огноо</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Регистр</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Хүйс</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Утас</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Харшилтай эсэх</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Картын дугаар</th>
                  <th className="text-left px-4 py-3">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
                      {PATIENT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </th>
                  <th className="text-left px-4 py-3">
                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={selectClass}>
                      {PAYMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {paged.map((p) => {
                  const typeStyle = PATIENT_TYPE_STYLES[p.patient_type] ?? { label: p.patient_type, className: '' };
                  const isOpen = menu?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={(e) => isOpen ? setMenu(null) : openMenuForRow(p.id, e.currentTarget)}
                      className={`cursor-pointer transition-colors ${isOpen ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'}`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{p.last_name}</td>
                      <td className="px-4 py-3 text-stone-900 dark:text-stone-100">{p.first_name}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{formatDate(p.date_of_birth)}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400 font-mono text-xs">{p.registry_number || '-'}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{p.gender ? GENDER_LABELS[p.gender] || p.gender : '-'}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{p.phone}</td>
                      <td className="px-4 py-3">
                        {p.has_allergy ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Тийм</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Үгүй</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400 font-mono">{p.card_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeStyle.className}`}>{typeStyle.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.payment_status === 'paid' ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Төлсөн</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Төлөөгүй</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">Эмчлүүлэгч олдсонгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: pagination + total */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    n === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="text-sm text-stone-500 dark:text-stone-400">Нийт: {filtered.length}</span>
          </div>
        </>
      )}

      {/* Floating action menu (rendered outside the scroll container) */}
      {menu && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 50 }}
          className="w-40 rounded-lg bg-white border border-stone-200 shadow-lg overflow-hidden dark:bg-stone-900 dark:border-stone-700"
        >
          <Link
            href={`/admin/patients/details/${menu.id}`}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <Eye size={14} /> Харах
          </Link>
          <Link
            href={`/admin/patients/edit/${menu.id}`}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <Pencil size={14} /> Засах
          </Link>
          <button
            type="button"
            onClick={() => deletePatient(menu.id)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 size={14} /> Устгах
          </button>
        </div>
      )}
    </div>
  );
}
