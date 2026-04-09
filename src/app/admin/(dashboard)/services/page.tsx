'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: { locale: string; title: string; description: string }[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/services?pageSize=50');
    const data = await res.json();
    setServices(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    fetchServices();
  };

  const getTranslation = (s: Service, locale: string) =>
    s.translations?.find((t) => t.locale === locale);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link href="/admin/services/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Add Service
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title (MN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title (EN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{s.sort_order}</td>
                  <td className="px-4 py-3 font-medium">{getTranslation(s, 'mn')?.title || '-'}</td>
                  <td className="px-4 py-3">{getTranslation(s, 'en')?.title || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/services/${s.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                      <button onClick={() => deleteService(s.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No services found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
