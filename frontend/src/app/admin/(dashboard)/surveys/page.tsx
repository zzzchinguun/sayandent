'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, Info, MessageSquarePlus, User as UserIcon, Clock } from 'lucide-react';

interface WishItem {
  id: string;
  title: string;
  description: string;
  created_by_email: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const MIN_TITLE = 4;
const MIN_DESCRIPTION = 20;

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SurveysPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wishlist');
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = async (title: string, description: string) => {
    setSubmitting(true);
    setPageError(null);
    try {
      const res = await fetch('/api/admin/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!data.success) {
        setPageError(data.error || 'Хадгалж чадсангүй');
        return false;
      }
      setItems((arr) => [data.data, ...arr]);
      setShowNew(false);
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id: string, title: string, description: string) => {
    setSubmitting(true);
    setPageError(null);
    try {
      const res = await fetch(`/api/admin/wishlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!data.success) {
        setPageError(data.error || 'Хадгалж чадсангүй');
        return false;
      }
      setItems((arr) => arr.map((it) => it.id === id ? data.data : it));
      setEditingId(null);
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (item: WishItem) => {
    if (!confirm(`"${item.title}" хүсэлтийг устгах уу?`)) return;
    const res = await fetch(`/api/admin/wishlist/${item.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      setItems((arr) => arr.filter((x) => x.id !== item.id));
    } else {
      setPageError(data.error || 'Устгаж чадсангүй');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Системийн санал асуулга</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Системд нэмэх, сайжруулах хүсэлтээ хөгжүүлэгчид үлдээх жагсаалт
          </p>
        </div>
        {!showNew && (
          <button
            type="button"
            onClick={() => { setShowNew(true); setEditingId(null); setPageError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> Хүсэлт нэмэх
          </button>
        )}
      </div>

      {/* Guidance banner */}
      <div className="mb-6 px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-900/40 dark:bg-primary-950/30">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            <strong className="text-stone-900 dark:text-stone-100">Аль болох тодорхой бичнэ үү.</strong>{' '}
            Гарчиг товч, тайлбар бол дэлгэрэнгүй байх ёстой. Дараах зүйлсийг хамруулна уу:{' '}
            <em>яагаад хэрэгтэй байгаа</em>, <em>одоо яаж ажилладаг ба яаж ажиллах ёстой</em>,{' '}
            <em>жишээ хэрэглээний тохиолдол</em>, ба <em>хэрэв хийгдэхгүй бол ямар үр дагавартай</em>.
            Тодорхой бичих тусам хөгжүүлэгчид илүү амар, уг ажил илүү хурдан хийгдэнэ.
          </div>
        </div>
      </div>

      {/* Inline create form */}
      {showNew && (
        <WishForm
          mode="create"
          submitting={submitting}
          onCancel={() => { setShowNew(false); setPageError(null); }}
          onSave={async (t, d) => createItem(t, d)}
        />
      )}

      {pageError && !submitting && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {pageError}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-stone-500 dark:text-stone-400 text-sm">Уншиж байна...</div>
        ) : items.length === 0 && !showNew ? (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-500 mb-3 dark:bg-stone-800 dark:text-stone-400">
              <MessageSquarePlus size={20} />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Одоогоор хүсэлт алга. Юу нэмэх, сайжруулмаар байгаа санаагаа дээрх товчоор үлдээнэ үү.
            </p>
          </div>
        ) : (
          items.map((it) => (
            editingId === it.id ? (
              <WishForm
                key={it.id}
                mode="edit"
                initialTitle={it.title}
                initialDescription={it.description}
                submitting={submitting}
                onCancel={() => { setEditingId(null); setPageError(null); }}
                onSave={async (t, d) => updateItem(it.id, t, d)}
              />
            ) : (
              <WishCard
                key={it.id}
                item={it}
                onEdit={() => { setEditingId(it.id); setShowNew(false); setPageError(null); }}
                onDelete={() => deleteItem(it)}
              />
            )
          ))
        )}
      </div>
    </div>
  );
}

// ────────────────────────── Wish card (read-only) ──────────────────────────

function WishCard({ item, onEdit, onDelete }: {
  item: WishItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const author = item.created_by_name || item.created_by_email || 'Тодорхойгүй';
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50 flex-1 min-w-0 break-words">
          {item.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            title="Засах"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Устгах"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
        {item.description}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
        <span className="inline-flex items-center gap-1">
          <UserIcon size={12} /> {author}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {fmtDateTime(item.created_at)}
        </span>
        {item.updated_at !== item.created_at && (
          <span className="text-stone-400 dark:text-stone-500">· {fmtDateTime(item.updated_at)}-нд шинэчилсэн</span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────── Inline form (create / edit) ──────────────────────────

function WishForm({
  mode, initialTitle = '', initialDescription = '', submitting, onCancel, onSave,
}: {
  mode: 'create' | 'edit';
  initialTitle?: string;
  initialDescription?: string;
  submitting: boolean;
  onCancel: () => void;
  onSave: (title: string, description: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [touched, setTouched] = useState(false);

  const titleTooShort = title.trim().length < MIN_TITLE;
  const descTooShort = description.trim().length < MIN_DESCRIPTION;
  const descLen = description.trim().length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (titleTooShort || descTooShort) return;
    await onSave(title.trim(), description.trim());
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border bg-white text-stone-900 placeholder:text-stone-400 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <form onSubmit={submit} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 mb-4">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-4">
        {mode === 'create' ? 'Шинэ хүсэлт' : 'Хүсэлт засах'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Гарчиг <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ: Үзлэгийн дэлгэцэнд хэвлэх товч нэмэх"
            className={`${inputClass} ${touched && titleTooShort ? 'border-red-300 dark:border-red-900/60' : 'border-stone-200 dark:border-stone-700'}`}
            required
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Богино, тодорхой нэр. Доод тал нь {MIN_TITLE} тэмдэгт.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Дэлгэрэнгүй тайлбар <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder={`Аль болох дэлгэрэнгүй бичнэ үү:
• Юу хиймээр байна вэ?
• Яагаад энэ шаардлагатай вэ?
• Одоо яаж ажилладаг, яаж ажиллах ёстой вэ?
• Жишээ хэрэглээний тохиолдол.`}
            className={`${inputClass} resize-y ${touched && descTooShort ? 'border-red-300 dark:border-red-900/60' : 'border-stone-200 dark:border-stone-700'}`}
            required
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Хөгжүүлэгчид ойлгомжтой байх тул жишээ, шалтгаан бичнэ үү. Доод тал нь {MIN_DESCRIPTION} тэмдэгт.
            </p>
            <span className={`text-xs font-mono ${descTooShort ? 'text-red-500' : 'text-stone-400 dark:text-stone-500'}`}>
              {descLen}/{MIN_DESCRIPTION}+
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Check size={14} />
          {submitting ? 'Хадгалж байна...' : (mode === 'create' ? 'Нэмэх' : 'Хадгалах')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          <X size={14} /> Болих
        </button>
      </div>
    </form>
  );
}
