'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ImageOff, ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

interface Translation { locale: string; name: string; title: string; bio: string }

// Best-effort transliteration so the slug field auto-fills as you type the
// Mongolian name. Users can still override.
function suggestSlug(name: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'ye',ё:'yo',ж:'j',з:'z',и:'i',й:'i',
    к:'k',л:'l',м:'m',н:'n',о:'o',ө:'u',п:'p',р:'r',с:'s',т:'t',у:'u',ү:'u',
    ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return name
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function StaffEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageOk, setImageOk] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [translations, setTranslations] = useState<Record<string, Translation>>({
    mn: { locale: 'mn', name: '', title: '', bio: '' },
    en: { locale: 'en', name: '', title: '', bio: '' },
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/staff/${id}`).then((r) => r.json()).then((data) => {
      if (!data.success) { setLoading(false); return; }
      const s = data.data;
      setSlug(s.slug);
      setSlugTouched(true);
      setImageUrl(s.image_url || '');
      setSortOrder(s.sort_order);
      setIsActive(s.is_active);
      const trans: Record<string, Translation> = {
        mn: { locale: 'mn', name: '', title: '', bio: '' },
        en: { locale: 'en', name: '', title: '', bio: '' },
      };
      for (const t of s.translations || []) trans[t.locale] = t;
      setTranslations(trans);
      setLoading(false);
    });
  }, [id, isNew]);

  const updateTrans = (l: 'mn' | 'en', field: keyof Translation, value: string) => {
    setTranslations((prev) => {
      const next = { ...prev, [l]: { ...prev[l], [field]: value } };
      // Auto-suggest slug from MN name unless the user has touched it
      if (l === 'mn' && field === 'name' && !slugTouched) {
        setSlug(suggestSlug(value));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { slug, imageUrl: imageUrl || undefined, sortOrder, isActive, translations: Object.values(translations) };
    const url = isNew ? '/api/admin/staff' : `/api/admin/staff/${id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (data.success) router.push('/admin/staff');
    else setError(data.error || 'Хадгалж чадсангүй');
  };

  const handleDelete = async () => {
    const fullName = translations.mn?.name || translations.en?.name || 'энэ ажилтны';
    if (!confirm(`${fullName} мэдээллийг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      router.push('/admin/staff');
    } else {
      setDeleting(false);
      setError(data.error || 'Устгаж чадсангүй');
    }
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5';
  const helpClass = 'text-xs text-stone-500 dark:text-stone-400 mt-1';
  const required = <span className="text-red-500 ml-0.5">*</span>;

  const headerName = useMemo(() => {
    return translations.mn?.name || translations.en?.name || (isNew ? 'Шинэ ажилтан' : 'Ажилтан');
  }, [translations, isNew]);

  if (loading) return <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/staff"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 shrink-0"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 truncate">
              {isNew ? 'Ажилтан нэмэх' : headerName}
            </h2>
            {!isNew && (
              <div className="text-xs text-stone-500 dark:text-stone-400">Ажилтны мэдээллийг засах</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
            }`}
          >
            <span
              className={`relative inline-block w-9 h-5 rounded-full transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
            {isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
              title="Бүрмөсөн устгах"
            >
              <Trash2 size={16} />
              {deleting ? 'Устгаж байна...' : 'Устгах'}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push('/admin/staff')}
            className="px-5 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            Болих
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Photo + settings row ── */}
        <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Image preview */}
            <div className="shrink-0">
              <label className={labelClass}>Зураг</label>
              <div className="w-32 h-32 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 overflow-hidden flex items-center justify-center">
                {imageUrl && imageOk ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt="Зураг"
                    className="w-full h-full object-cover"
                    onError={() => setImageOk(false)}
                    onLoad={() => setImageOk(true)}
                  />
                ) : (
                  <ImageOff size={28} className="text-stone-400 dark:text-stone-600" />
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="sm:col-span-2">
                <label className={labelClass}>Зургийн URL</label>
                <input
                  value={imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setImageOk(true); }}
                  placeholder="https://..."
                  className={inputClass}
                />
                <p className={helpClass}>Зургийн холбоосыг оруулахад зүүн талд урьдчилсан харагдана.</p>
              </div>

              <div>
                <label className={labelClass}>Тогтмол хаяг (slug)</label>
                <input
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  placeholder="ner-ovog"
                  className={`${inputClass} font-mono`}
                  required
                />
                <p className={helpClass}>URL дээр харагдах нэр. Зөвхөн латин үсэг, тоо, зураас.</p>
              </div>

              <div>
                <label className={labelClass}>Эрэмбэ</label>
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => setSortOrder((s) => s - 1)}
                    className="shrink-0 inline-flex items-center justify-center w-10 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
                    aria-label="Багасгах"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className={`${inputClass} text-center`}
                  />
                  <button
                    type="button"
                    onClick={() => setSortOrder((s) => s + 1)}
                    className="shrink-0 inline-flex items-center justify-center w-10 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
                    aria-label="Нэмэгдүүлэх"
                  >
                    <ArrowUp size={14} />
                  </button>
                </div>
                <p className={helpClass}>Бага тоотой нь эхэнд харагдана.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Translations: side by side, no tabs ── */}
        <section className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-800">
            <LocaleColumn
              flag="🇲🇳"
              title="Монгол хэл"
              required={required}
              labelClass={labelClass}
              inputClass={inputClass}
              helpClass={helpClass}
              translation={translations.mn}
              onChange={(field, value) => updateTrans('mn', field, value)}
              hint="Сайт дээр анхдагчаар харагдана"
            />
            <LocaleColumn
              flag="🇬🇧"
              title="Англи хэл"
              required={required}
              labelClass={labelClass}
              inputClass={inputClass}
              helpClass={helpClass}
              translation={translations.en}
              onChange={(field, value) => updateTrans('en', field, value)}
              hint="English locale-д харагдана"
            />
          </div>
        </section>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </form>
  );
}

function LocaleColumn({
  flag, title, hint, required, labelClass, inputClass, helpClass, translation, onChange,
}: {
  flag: string;
  title: string;
  hint: string;
  required: React.ReactNode;
  labelClass: string;
  inputClass: string;
  helpClass: string;
  translation: Translation;
  onChange: (field: keyof Translation, value: string) => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl leading-none">{flag}</span>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
        <span className="text-xs text-stone-400 dark:text-stone-500">· {hint}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Нэр {required}</label>
          <input
            value={translation?.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Албан тушаал {required}</label>
          <input
            value={translation?.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Танилцуулга {required}</label>
          <textarea
            value={translation?.bio || ''}
            onChange={(e) => onChange('bio', e.target.value)}
            rows={5}
            className={inputClass}
            required
          />
          <p className={helpClass}>Эмчийн товч намтар, мэргэшил, сонирхол.</p>
        </div>
      </div>
    </div>
  );
}
