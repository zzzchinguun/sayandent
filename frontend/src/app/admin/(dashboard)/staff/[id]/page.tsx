'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Translation { locale: string; name: string; title: string; bio: string }

export default function StaffEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [locale, setLocale] = useState<'mn' | 'en'>('mn');
  const [translations, setTranslations] = useState<Record<string, Translation>>({
    mn: { locale: 'mn', name: '', title: '', bio: '' },
    en: { locale: 'en', name: '', title: '', bio: '' },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/staff/${id}`).then((r) => r.json()).then((data) => {
      if (!data.success) return;
      const s = data.data;
      setSlug(s.slug);
      setImageUrl(s.image_url || '');
      setSortOrder(s.sort_order);
      setIsActive(s.is_active);
      const trans: Record<string, Translation> = {
        mn: { locale: 'mn', name: '', title: '', bio: '' },
        en: { locale: 'en', name: '', title: '', bio: '' },
      };
      for (const t of s.translations || []) trans[t.locale] = t;
      setTranslations(trans);
    });
  }, [id, isNew]);

  const updateTrans = (field: keyof Translation, value: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { slug, imageUrl: imageUrl || undefined, sortOrder, isActive, translations: Object.values(translations) };
    const url = isNew ? '/api/admin/staff' : `/api/admin/staff/${id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (data.success) router.push('/admin/staff');
    else alert(data.error || 'Save failed');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? 'Add Staff' : 'Edit Staff'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Name ({locale.toUpperCase()})</label>
              <input value={translations[locale]?.name || ''} onChange={(e) => updateTrans('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title ({locale.toUpperCase()})</label>
              <input value={translations[locale]?.title || ''} onChange={(e) => updateTrans('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio ({locale.toUpperCase()})</label>
              <textarea value={translations[locale]?.bio || ''} onChange={(e) => updateTrans('bio', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.push('/admin/staff')} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
