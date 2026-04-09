'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils/cn';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    const hasLocale = locales.includes(segments[1] as Locale);

    let newPath: string;
    if (hasLocale) {
      segments[1] = newLocale;
      newPath = segments.join('/');
    } else {
      newPath = `/${newLocale}${pathname}`;
    }

    router.push(newPath);
  };

  return (
    <div className={cn('flex items-center gap-1 rounded-full bg-earth-100 p-1', className)}>
      {locales.map((loc) => (
        <motion.button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            locale === loc ? 'bg-primary-600 text-white' : 'text-earth-600 hover:text-primary-700'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {localeNames[loc]}
        </motion.button>
      ))}
    </div>
  );
}
