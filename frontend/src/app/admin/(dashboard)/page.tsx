'use client';

import { useEffect, useState } from 'react';

interface Stats {
  appointments: number;
  contacts: number;
  services: number;
  faqs: number;
  testimonials: number;
  staff: number;
  unreadContacts: number;
  pendingAppointments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const endpoints = [
        { key: 'appointments', url: '/api/admin/appointments?pageSize=1' },
        { key: 'contacts', url: '/api/admin/contacts?pageSize=1' },
        { key: 'services', url: '/api/admin/services?pageSize=1' },
        { key: 'faqs', url: '/api/admin/faqs?pageSize=1' },
        { key: 'testimonials', url: '/api/admin/testimonials?pageSize=1' },
        { key: 'staff', url: '/api/admin/staff?pageSize=1' },
        { key: 'unreadContacts', url: '/api/admin/contacts?pageSize=1&isRead=false' },
        { key: 'pendingAppointments', url: '/api/admin/appointments?pageSize=1&status=pending' },
      ];

      const results = await Promise.all(
        endpoints.map(async (ep) => {
          const res = await fetch(ep.url);
          const data = await res.json();
          return { key: ep.key, total: data.meta?.total ?? 0 };
        })
      );

      const s = {} as Record<string, number>;
      for (const r of results) s[r.key] = r.total;
      setStats(s as unknown as Stats);
    }
    fetchStats();
  }, []);

  if (!stats) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const cards = [
    { label: 'Pending Appointments', value: stats.pendingAppointments, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Unread Messages', value: stats.unreadContacts, color: 'bg-red-50 text-red-700' },
    { label: 'Total Appointments', value: stats.appointments, color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Messages', value: stats.contacts, color: 'bg-green-50 text-green-700' },
    { label: 'Services', value: stats.services, color: 'bg-purple-50 text-purple-700' },
    { label: 'FAQs', value: stats.faqs, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Testimonials', value: stats.testimonials, color: 'bg-pink-50 text-pink-700' },
    { label: 'Staff', value: stats.staff, color: 'bg-teal-50 text-teal-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm font-medium opacity-80">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
