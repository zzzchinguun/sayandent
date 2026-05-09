'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

interface Employee {
  id: string;
  last_name: string;
  first_name: string;
  registry_number: string | null;
  email: string | null;
  role: string;
  phone: string | null;
  branch: string | null;
  address: string | null;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  receptionist: { label: 'Ресепшн',     className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  doctor:       { label: 'Энгийн эмч',  className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  admin:        { label: 'Админ',       className: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
};

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/employees');
    const data = await res.json();
    setEmployees(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetch('/api/auth/me').then(r => r.json()).then(j => {
      if (j?.success) setUserRole(j.data.role);
    }).catch(() => {});
  }, [fetchEmployees]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Ажилчид</h2>
      </div>

      {loading ? (
        <div className="text-stone-500 dark:text-stone-400">Уншиж байна...</div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-12">№</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Овог</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Нэр</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Регистр</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">И-мэйл</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Эрх</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Утас</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Харьялагдах салбар</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Хаяг</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Төлөв</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 w-16">Засах</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {employees.map((emp, idx) => {
                const role = ROLE_LABELS[emp.role] ?? { label: emp.role, className: 'bg-stone-100 text-stone-800' };
                return (
                  <tr key={emp.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{emp.last_name}</td>
                    <td className="px-4 py-3 text-stone-900 dark:text-stone-100">{emp.first_name}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400 font-mono text-xs">{emp.registry_number || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{emp.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${role.className}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{emp.phone || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{emp.branch || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400 max-w-[200px] truncate">{emp.address || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        emp.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {emp.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/staff/${emp.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                        >
                          <Pencil size={15} />
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={isAdmin ? 11 : 10} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">Ажилтан олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
