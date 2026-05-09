'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/contacts?pageSize=1&isRead=false');
        const json = await res.json();
        if (!cancelled && json?.success) setCount(Number(json.meta?.total ?? 0));
      } catch {
        // swallow — bell just shows 0
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const display = count && count > 99 ? '99+' : count ?? 0;
  const hasUnread = (count ?? 0) > 0;

  return (
    <button
      type="button"
      aria-label="Notifications"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      <Bell size={18} />
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center ring-2 ring-white dark:ring-stone-950">
          {display}
        </span>
      )}
    </button>
  );
}
