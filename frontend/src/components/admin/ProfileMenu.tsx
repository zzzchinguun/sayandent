'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

interface Me {
  email: string;
  name: string;
  role: string;
}

function initialsFor(name: string, email: string) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => {
      if (j?.success) setMe(j.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const name = me?.name || 'Admin';
  const email = me?.email || '';
  const role = me?.role === 'superadmin' ? 'Супер админ' : 'Админ';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-stone-100 transition-colors dark:hover:bg-stone-800"
      >
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-semibold">
          {initialsFor(name, email)}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{name}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">{role}</span>
        </span>
        <ChevronDown size={14} className="text-stone-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-stone-200 shadow-lg overflow-hidden dark:bg-stone-900 dark:border-stone-800 z-50">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
            <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{name}</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 truncate">{email}</div>
          </div>
          <div className="p-1">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push('/admin/users'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <UserIcon size={15} />
              Хэрэглэгчид
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <LogOut size={15} />
              Гарах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
