import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';
// Static imports — not `await import(\`...${locale}.json\`)`. The template
// literal form doesn't HMR-invalidate cleanly under Turbopack: when you add
// a new key to a messages JSON file, the cached module sticks around and
// next-intl keeps reporting MISSING_MESSAGE until you fully wipe `.next`.
// Static imports get tracked as real module dependencies and reload on edit.
import mn from '../../../messages/mn.json';
import en from '../../../messages/en.json';

const messagesByLocale = { mn, en } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'mn';
  }

  return {
    locale,
    messages: messagesByLocale[locale as Locale],
  };
});
