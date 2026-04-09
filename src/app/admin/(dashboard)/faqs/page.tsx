'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface FAQ {
  id: string;
  sort_order: number;
  is_active: boolean;
  translations: { locale: string; question: string; answer: string }[];
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/faqs?pageSize=50');
    const data = await res.json();
    setFaqs(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
    fetchFaqs();
  };

  const getTrans = (f: FAQ, locale: string) => f.translations?.find((t) => t.locale === locale);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">FAQs</h1>
        <Link href="/admin/faqs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add FAQ</Link>
      </div>

      {loading ? <div className="text-gray-500">Loading...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Question (MN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Question (EN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {faqs.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{f.sort_order}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{getTrans(f, 'mn')?.question || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{getTrans(f, 'en')?.question || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${f.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/faqs/${f.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                      <button onClick={() => deleteFaq(f.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No FAQs found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
