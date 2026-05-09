'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Админ',
  superadmin: 'Супер админ',
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'admin' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (data.success) setUsers(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setForm({ email: '', password: '', name: '', role: 'admin' });
        fetchUsers();
      } else {
        setError(data.error || 'Хэрэглэгч үүсгэхэд алдаа гарлаа');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Энэ хэрэглэгчийг устгах уу?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Хэрэглэгчид</h2>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          {showForm ? <><X size={16} /> Болих</> : <><Plus size={16} /> Хэрэглэгч нэмэх</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createUser}
          className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mb-6 max-w-md"
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Нэр</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>И-мэйл</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Нууц үг</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Эрх</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              >
                <option value="admin">Админ</option>
                <option value="superadmin">Супер админ</option>
              </select>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Хадгалж байна...' : 'Үүсгэх'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-5 py-2 text-sm font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
            >
              Болих
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Нэр</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">И-мэйл</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Эрх</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Үүсгэсэн</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-20">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{u.name}</td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500 dark:text-stone-400 font-mono text-xs">
                    {new Date(u.created_at).toLocaleDateString('mn-MN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                      title="Устгах"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">
                    Хэрэглэгч олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
