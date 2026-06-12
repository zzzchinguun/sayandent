'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  DIAGNOSES,
  TREATMENTS,
  toothLabel,
  PERMANENT_UPPER,
  PERMANENT_LOWER,
  DECIDUOUS_UPPER,
  DECIDUOUS_LOWER,
} from '@/lib/dental/codes';

export interface TreatmentItem {
  tooth_code: string | null;
  tooth_label: string | null;
  diagnosis_code: string | null;
  diagnosis_name: string | null;
  treatment_name: string;
  price: number;
  discount: number;
  detail: string | null;
}

const VISIT_TYPES: { value: 'first' | 'repeat' | 'us'; label: string }[] = [
  { value: 'first',  label: 'Анх удаа' },
  { value: 'repeat', label: 'Давтан' },
  { value: 'us',     label: 'У.С үзлэг' },
];

function fmtPrice(n: number) {
  return n.toLocaleString('mn-MN');
}

const inputClass =
  'w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5';

export default function TreatmentStep({
  appointmentId,
  visitType,
  setVisitType,
  onExamDone,
}: {
  appointmentId: string;
  visitType: 'first' | 'repeat' | 'us';
  setVisitType: (v: 'first' | 'repeat' | 'us') => void;
  onExamDone: () => void;
}) {
  // Entry mode
  const [entryMode, setEntryMode] = useState<'select' | 'manual'>('select');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // Tooth selection
  const [grouping, setGrouping] = useState<'none' | 'all' | 'noteeth'>('none');
  const [dentition, setDentition] = useState<'permanent' | 'deciduous'>('permanent');
  const [selectedTeeth, setSelectedTeeth] = useState<Set<string>>(new Set());

  // Visit-level fields
  const [detail, setDetail] = useState('');
  const [complaint, setComplaint] = useState('');
  const [insured, setInsured] = useState(true);
  const [examFee, setExamFee] = useState('0');

  // Saved/added line items
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/appointments/${appointmentId}/treatments`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setItems(d.data.items ?? []);
        setComplaint(d.data.complaint ?? '');
        if (typeof d.data.insured === 'boolean') setInsured(d.data.insured);
        if (typeof d.data.exam_fee === 'number') setExamFee(String(d.data.exam_fee));
      })
      .catch(() => {});
  }, [appointmentId]);

  const selectedTreatment = useMemo(
    () => TREATMENTS.find((t) => t.name === treatmentName) ?? null,
    [treatmentName],
  );
  const selectedDiagnosis = useMemo(
    () => DIAGNOSES.find((d) => d.code === diagnosisCode) ?? null,
    [diagnosisCode],
  );

  function toggleTooth(code: string) {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function addItems() {
    setMessage(null);
    const name = entryMode === 'select' ? treatmentName : manualName.trim();
    const price = entryMode === 'select' ? (selectedTreatment?.price ?? 0) : parseInt(manualPrice, 10) || 0;
    if (!name) {
      setMessage('Эмчилгээ сонгоно уу');
      return;
    }
    if (grouping === 'none' && selectedTeeth.size === 0) {
      setMessage('Шүд сонгоно уу');
      return;
    }

    const base = {
      diagnosis_code: selectedDiagnosis?.code ?? null,
      diagnosis_name: selectedDiagnosis?.name ?? null,
      treatment_name: name,
      price,
      discount: 0,
      detail: detail.trim() || null,
    };

    const newRows: TreatmentItem[] =
      grouping === 'all'
        ? [{ ...base, tooth_code: 'all', tooth_label: 'Бүх шүд' }]
        : grouping === 'noteeth'
          ? [{ ...base, tooth_code: null, tooth_label: 'Шүдгүй эмчилгээ' }]
          : Array.from(selectedTeeth).sort().map((code) => ({
              ...base,
              tooth_code: code,
              tooth_label: toothLabel(code),
            }));

    setItems((prev) => [...prev, ...newRows]);
    setSelectedTeeth(new Set());
    setDetail('');
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save(thenExamined: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/treatments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          complaint: complaint.trim() || null,
          insured,
          exam_fee: parseInt(examFee, 10) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        setMessage(data.error || 'Хадгалж чадсангүй');
        return;
      }
      if (thenExamined) {
        await fetch(`/api/admin/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'examined' }),
        });
        onExamDone();
      } else {
        setMessage('Хадгалагдлаа');
      }
    } catch {
      setMessage('Сервертэй холбогдож чадсангүй');
    } finally {
      setSaving(false);
    }
  }

  const upper = dentition === 'permanent' ? PERMANENT_UPPER : DECIDUOUS_UPPER;
  const lower = dentition === 'permanent' ? PERMANENT_LOWER : DECIDUOUS_LOWER;
  const total = items.reduce((s, it) => s + it.price - it.discount, 0);

  return (
    <div>
      {/* ── Entry mode + pickers ── */}
      <div className="flex flex-wrap items-center gap-5 mb-4">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Эмчилгээ:</span>
        {([['select', 'Сонгоно уу'], ['manual', 'Гараас оруулах']] as const).map(([v, label]) => (
          <label key={v} className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="entry-mode"
              checked={entryMode === v}
              onChange={() => setEntryMode(v)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-stone-700 dark:text-stone-300">{label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <select value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} className={inputClass}>
          <option value="">Онош сонгох</option>
          {DIAGNOSES.map((d) => (
            <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
          ))}
        </select>
        {entryMode === 'select' ? (
          <select value={treatmentName} onChange={(e) => setTreatmentName(e.target.value)} className={inputClass}>
            <option value="">Эмчилгээ сонгоно уу</option>
            {TREATMENTS.map((t, i) => (
              <option key={i} value={t.name}>{t.name} — {fmtPrice(t.price)}₮</option>
            ))}
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Эмчилгээний нэр"
              className={inputClass}
            />
            <input
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Төлбөр"
              inputMode="numeric"
              className={inputClass + ' max-w-32'}
            />
          </div>
        )}
      </div>

      {/* ── Tooth grouping ── */}
      <div className="flex flex-wrap items-center gap-5 mb-4">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Шүдний бүлэглэлт:</span>
        {([['none', 'Бүлэглээгүй'], ['all', 'Бүх шүд'], ['noteeth', 'Шүдгүй эмчилгээ']] as const).map(([v, label]) => (
          <label key={v} className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tooth-grouping"
              checked={grouping === v}
              onChange={() => setGrouping(v)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-stone-700 dark:text-stone-300">{label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-6">
        {/* ── Tooth chart ── */}
        <div className={grouping !== 'none' ? 'opacity-40 pointer-events-none select-none' : ''}>
          <div className="flex border-b border-stone-200 dark:border-stone-700 mb-4">
            {([['permanent', 'Байнгын шүд'], ['deciduous', 'Сүүн шүд']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => { setDentition(v); setSelectedTeeth(new Set()); }}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  dentition === v
                    ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                    : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-rose-50/60 dark:bg-rose-950/10 p-4 space-y-6">
            <ToothRow codes={upper} selected={selectedTeeth} onToggle={toggleTooth} arch="Дээд" />
            <ToothRow codes={lower} selected={selectedTeeth} onToggle={toggleTooth} arch="Доод" />
          </div>
          {selectedTeeth.size > 0 && (
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Сонгосон: {Array.from(selectedTeeth).sort().map((c) => toothLabel(c)).join('; ')}
            </p>
          )}
        </div>

        {/* ── Right column: exam fields ── */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Дэлгэрэнгүй</label>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Зовиур</label>
            <input value={complaint} onChange={(e) => setComplaint(e.target.value)} className={inputClass} />
          </div>
          <div>
            <span className={labelClass}>Даатгал</span>
            <div className="flex items-center gap-5 pt-1">
              {([[true, 'Даатгалтай'], [false, 'Даатгалгүй']] as const).map(([v, label]) => (
                <label key={label} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="insured"
                    checked={insured === v}
                    onChange={() => setInsured(v)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className={labelClass}>Анхан давтан эсэх</span>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              {VISIT_TYPES.map((v) => (
                <label key={v.value} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="visit-type-step2"
                    checked={visitType === v.value}
                    onChange={() => setVisitType(v.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">{v.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Үзлэг дууссан</label>
            <input
              value={examFee}
              onChange={(e) => setExamFee(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={addItems}
            className="w-full px-5 py-2.5 text-sm font-semibold rounded-lg border border-primary-600 text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40 transition-colors"
          >
            + Нэмэх
          </button>
        </div>
      </div>

      {/* ── Line items table ── */}
      <div className="mt-6 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Шүд</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Эмчилгээ</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-28">Төлбөр</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-28">Хөнгөлөлт</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Дэлгэрэнгүй</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400 dark:text-stone-500">
                  Эмчилгээ нэмээгүй байна
                </td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="px-4 py-2.5 text-stone-900 dark:text-stone-100">{it.tooth_label || '—'}</td>
                  <td className="px-4 py-2.5 text-stone-900 dark:text-stone-100">{it.treatment_name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-stone-700 dark:text-stone-300">{fmtPrice(it.price)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-stone-700 dark:text-stone-300">{fmtPrice(it.discount)}</td>
                  <td className="px-4 py-2.5 text-stone-600 dark:text-stone-400">{it.detail || ''}</td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Устгах"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-stone-900 dark:text-stone-100" colSpan={2}>Нийт</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-stone-900 dark:text-stone-100">{fmtPrice(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Actions ── */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {message && (
          <span className={`text-sm ${message === 'Хадгалагдлаа' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {message}
          </span>
        )}
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          Хадгалах
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          Үзлэг дууссан
        </button>
      </div>
    </div>
  );
}

function ToothRow({
  codes,
  selected,
  onToggle,
  arch,
}: {
  codes: string[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  arch: string;
}) {
  const mid = codes.length / 2;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-1.5">{arch}</p>
      <div className="flex flex-wrap items-center gap-1">
        {codes.map((c, i) => (
          <span key={c} className="flex items-center">
            {i === mid && <span className="w-px self-stretch bg-stone-300 dark:bg-stone-600 mx-1.5" />}
            <button
              type="button"
              onClick={() => onToggle(c)}
              title={c}
              className={`w-9 h-10 rounded-lg border text-xs font-semibold transition-colors ${
                selected.has(c)
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-primary-400 hover:text-primary-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
              }`}
            >
              {c}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
