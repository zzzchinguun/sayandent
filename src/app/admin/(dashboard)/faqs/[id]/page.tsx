'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Translation { locale: string; question: string; answer: string }

export default function FAQEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [locale, setLocale] = useState<'mn' | 'en'>('mn');
  const [translations, setTranslations] = useState<Record<string, Translation>>({
    mn: { locale: 'mn', question: '', answer: '' },
    en: { locale: 'en', question: '', answer: '' },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/faqs/${id}`).then((r) => r.json()).then((data) => {
      if (!data.success) return;
      const f = data.data;
      setSortOrder(f.sort_order);
      setIsActive(f.is_active);
      const trans: Record<string, Translation> = { mn: { locale: 'mn', question: '', answer: '' }, en: { locale: 'en', question: '', answer: '' } };
      for (const t of f.translations || []) trans[t.locale] = t;
      setTranslations(trans);
    });
  }, [id, isNew]);

  const updateTrans = (field: keyof Translation, value: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { sortOrder, isActive, translations: Object.values(translations) };
    const url = isNew ? '/api/admin/faqs' : `/api/admin/faqs/${id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (data.success) router.push('/admin/faqs');
    else alert(data.error || 'Save failed');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? 'Add FAQ' : 'Edit FAQ'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex gap-2 mb-4">
            {(['mn', 'en'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLocale(l)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${locale === l ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l === 'mn' ? 'Монгол' : 'English'}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question ({locale.toUpperCase()})</label>
              <input value={translations[locale]?.question || ''} onChange={(e) => updateTrans('question', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer ({locale.toUpperCase()})</label>
              <textarea value={translations[locale]?.answer || ''} onChange={(e) => updateTrans('answer', e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.push('/admin/faqs')} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
