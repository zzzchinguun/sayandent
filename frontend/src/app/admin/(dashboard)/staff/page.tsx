'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Staff {
  id: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  translations: { locale: string; name: string; title: string; bio: string }[];
}

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/staff?pageSize=50');
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const getTrans = (item: Staff, locale: string) => item.translations?.find((t) => t.locale === locale);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Link href="/admin/staff/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Staff</Link>
      </div>

      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (MN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (EN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3 font-medium">{getTrans(item, 'mn')?.name || '-'}</td>
                  <td className="px-4 py-3">{getTrans(item, 'en')?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{getTrans(item, 'en')?.title || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/staff/${item.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                      <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No staff found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
