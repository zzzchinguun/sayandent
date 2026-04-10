export const locales = ['mn', 'en'] as const;
export const defaultLocale = 'mn' as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  mn: 'Монгол',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  mn: '🇲🇳',
  en: '🇬🇧',
};
