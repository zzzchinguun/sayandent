'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import ThemeToggle from '@/components/admin/ThemeToggle';
import NotificationBell from '@/components/admin/NotificationBell';
import ProfileMenu from '@/components/admin/ProfileMenu';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Цагийн хуваарь',
  '/admin/visits': 'Үзлэгүүд',
  '/admin/patients': 'Эмчлүүлэгчид',
  '/admin/staff': 'Ажилчид',
  '/admin/lab-orders': 'Лабын захиалга',
  '/admin/diagnosis': 'Эмчийн онош',
  '/admin/treatments': 'Эмчилгээ',
  '/admin/teeth': 'Шүд',
  '/admin/order-diagnosis': 'Захиалгын онош',
  '/admin/faqs': 'Түгээмэл асуулт',
  '/admin/users': 'Хэрэглэгчид',
  '/admin/contacts': 'Санал хүсэлт',
  '/admin/surveys': 'Системийн санал асуулга',
};

function titleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // longest-prefix match for /admin/services/[id] etc.
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => k !== '/admin' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : 'Админ';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // close mobile drawer on navigation
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 transform transition-transform lg:translate-x-0 lg:static lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 dark:bg-stone-900/80 dark:border-stone-800">
          <div className="h-full px-4 lg:px-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Logo on mobile (sidebar hidden) */}
            <div className="lg:hidden">
              <img src="/images/logo/logo-dark.png" alt="Sayan Dent" className="h-6 w-auto dark:hidden" />
              <img src="/images/logo/logo-light.png" alt="Sayan Dent" className="h-6 w-auto hidden dark:block" />
            </div>
            <h1 className="hidden lg:block text-base font-semibold text-stone-900 dark:text-stone-50 truncate">
              {titleFor(pathname)}
            </h1>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
              <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1" />
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
