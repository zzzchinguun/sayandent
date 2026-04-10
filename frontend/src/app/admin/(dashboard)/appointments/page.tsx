'use client';

import { useEffect, useState, useCallback } from 'react';

interface Appointment {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  service_type: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/admin/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.data || []);
    setMeta(data.meta || meta);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAppointments(meta.page);
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('Delete this appointment?')) return;
    await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' });
    fetchAppointments(meta.page);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date & Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{apt.full_name}</td>
                      <td className="px-4 py-3">
                        <div>{apt.email}</div>
                        <div className="text-gray-500">{apt.phone}</div>
                      </td>
                      <td className="px-4 py-3">{apt.preferred_date} {apt.preferred_time}</td>
                      <td className="px-4 py-3">{apt.service_type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || ''}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {apt.status === 'pending' && (
                            <button onClick={() => updateStatus(apt.id, 'confirmed')} className="text-blue-600 hover:underline text-xs">Confirm</button>
                          )}
                          {apt.status === 'confirmed' && (
                            <button onClick={() => updateStatus(apt.id, 'completed')} className="text-green-600 hover:underline text-xs">Complete</button>
                          )}
                          {apt.status !== 'cancelled' && (
                            <button onClick={() => updateStatus(apt.id, 'cancelled')} className="text-orange-600 hover:underline text-xs">Cancel</button>
                          )}
                          <button onClick={() => deleteAppointment(apt.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No appointments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex gap-2 mt-4 justify-center">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchAppointments(p)}
                  className={`px-3 py-1 rounded text-sm ${p === meta.page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
