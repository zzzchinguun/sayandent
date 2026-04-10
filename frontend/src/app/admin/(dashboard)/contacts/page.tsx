'use client';

import { useEffect, useState, useCallback } from 'react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  replied_at: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter) params.set('isRead', filter);

    const res = await fetch(`/api/admin/contacts?${params}`);
    const data = await res.json();
    setContacts(data.data || []);
    setMeta(data.meta || meta);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const markRead = async (id: string, isRead: boolean) => {
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead }),
    });
    fetchContacts(meta.page);
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchContacts(meta.page);
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); if (!c.is_read) markRead(c.id, true); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === c.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${!c.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {!c.is_read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" />}
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-500 truncate">{c.message}</div>
              </button>
            ))}
            {contacts.length === 0 && (
              <div className="text-center text-gray-500 py-8">No messages found</div>
            )}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex gap-2 mt-4 justify-center">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchContacts(p)}
                className={`px-3 py-1 rounded text-sm ${p === meta.page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 bg-white rounded-xl border border-gray-200 p-6 sticky top-4 self-start">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="text-sm text-gray-500 mb-1">{selected.email}</div>
          {selected.phone && <div className="text-sm text-gray-500 mb-4">{selected.phone}</div>}
          <div className="text-sm text-gray-400 mb-4">{new Date(selected.created_at).toLocaleString()}</div>
          <p className="text-gray-700 text-sm leading-relaxed mb-6">{selected.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => markRead(selected.id, !selected.is_read)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Mark as {selected.is_read ? 'unread' : 'read'}
            </button>
            <button
              onClick={() => deleteContact(selected.id)}
              className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
