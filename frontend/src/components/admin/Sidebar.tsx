'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  Users,
  UserCog,
  FlaskConical,
  FileBarChart,
  Stethoscope,
  HelpCircle,
  MessagesSquare,
  ClipboardCheck,
  ChevronDown,
  Lock,
} from 'lucide-react';

type NavLeaf = {
  kind: 'leaf';
  href: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  locked?: boolean;
};

type NavGroup = {
  kind: 'group';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultOpen?: boolean;
  items: { href: string; label: string; locked?: boolean }[];
};

type NavDivider = { kind: 'divider' };

type NavItem = NavLeaf | NavGroup | NavDivider;

const NAV: NavItem[] = [
  { kind: 'leaf', href: '/admin',           label: 'Цагийн хуваарь',  icon: CalendarDays },
  { kind: 'leaf', href: '/admin/visits',    label: 'Үзлэгүүд',         icon: ClipboardList },
  { kind: 'leaf', href: '/admin/patients',  label: 'Эмчлүүлэгчид',    icon: Users },
  { kind: 'leaf', href: '/admin/staff',     label: 'Ажилчид',          icon: UserCog },
  { kind: 'divider' },
  { kind: 'leaf', href: '/admin/lab-orders', label: 'Лабын захиалга',  icon: FlaskConical },
  { kind: 'leaf', href: '#',                 label: 'Төлбөрийн график', icon: FileBarChart, locked: true },
  {
    kind: 'group',
    label: 'Эмчилгээ',
    icon: Stethoscope,
    defaultOpen: false,
    items: [
      { href: '/admin/treatments?tab=diagnosis', label: 'Эмчийн онош' },
      { href: '/admin/treatments?tab=treatment', label: 'Эмчилгээ' },
      { href: '#teeth',           label: 'Шүд',            locked: true },
      { href: '#order-diagnosis', label: 'Захиалгын онош', locked: true },
    ],
  },
  { kind: 'divider' },
  {
    kind: 'group',
    label: 'Тусламж',
    icon: HelpCircle,
    defaultOpen: false,
    items: [
      { href: '/admin/faqs',  label: 'Түгээмэл асуулт' },
      { href: '/admin/users', label: 'Хэрэглэгчид' },
    ],
  },
  { kind: 'leaf', href: '/admin/contacts', label: 'Санал хүсэлт', icon: MessagesSquare },
  { kind: 'leaf', href: '/admin/surveys',  label: 'Системийн санал асуулга', icon: ClipboardCheck },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-stone-200 dark:bg-stone-900 dark:border-stone-800">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-stone-200 dark:border-stone-800">
        <img src="/images/logo/logo-dark.png" alt="Sayan Dent" className="h-8 w-auto dark:hidden" />
        <img src="/images/logo/logo-light.png" alt="Sayan Dent" className="h-8 w-auto hidden dark:block" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item, idx) => {
          if (item.kind === 'divider') {
            return <div key={`d-${idx}`} className="h-px bg-stone-200 my-3 mx-2 dark:bg-stone-800" />;
          }
          if (item.kind === 'group') {
            return <NavGroupItem key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />;
          }
          return <NavLeafItem key={item.href + item.label} item={item} pathname={pathname} onNavigate={onNavigate} />;
        })}
      </nav>
    </aside>
  );
}

function NavLeafItem({ item, pathname, onNavigate }: { item: NavLeaf; pathname: string; onNavigate?: () => void }) {
  const Icon = item.icon;
  const isActive = !item.locked && (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)));

  if (item.locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 dark:text-stone-600 cursor-not-allowed select-none">
        {Icon && <Icon size={18} className="shrink-0" />}
        <span className="flex-1">{item.label}</span>
        <Lock size={14} />
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
        isActive
          ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-950/50 dark:text-primary-200'
          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100',
      ].join(' ')}
    >
      {Icon && <Icon size={18} className="shrink-0" />}
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroupItem({ item, pathname, onNavigate }: { item: NavGroup; pathname: string; onNavigate?: () => void }) {
  const containsActive = item.items.some(s => {
    const base = s.href.split('?')[0];
    return !s.locked && (pathname === base || pathname.startsWith(base + '/'));
  });
  const [open, setOpen] = useState<boolean>(item.defaultOpen ?? containsActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        <Icon size={18} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown size={14} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-0.5 ml-7 pl-3 border-l border-stone-200 dark:border-stone-800 space-y-0.5">
          {item.items.map((s) => {
            if (s.locked) {
              return (
                <div
                  key={s.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-400 dark:text-stone-600 cursor-not-allowed select-none"
                >
                  <span className="flex-1">{s.label}</span>
                  <Lock size={12} />
                </div>
              );
            }
            const base = s.href.split('?')[0];
            const isActive = pathname === base || pathname.startsWith(base + '/');
            return (
              <Link
                key={s.href}
                href={s.href}
                onClick={onNavigate}
                className={[
                  'block px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-950/50 dark:text-primary-200'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100',
                ].join(' ')}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
