import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Montserrat, Playfair_Display, Exo_2 } from 'next/font/google';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { ScrollToTop } from '@/components/ui';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sayandent.vercel.app';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});

const exo2 = Exo_2({
  variable: '--font-exo2',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const t = messages.metadata as Record<string, string>;

  const canonicalUrl = locale === defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    title: t.title,
    description: t.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        mn: SITE_URL,
        en: `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: canonicalUrl,
      siteName: 'Саян Дент | Sayan Dent',
      locale: locale === 'mn' ? 'mn_MN' : 'en_US',
      alternateLocale: locale === 'mn' ? 'en_US' : 'mn_MN',
      type: 'website',
    },
    keywords: locale === 'mn'
      ? ['Саян Дент', 'шүдний эмнэлэг', 'шүдний эмч', 'имплант', 'ортодонт', 'шүд цайруулах', 'Улаанбаатар']
      : ['Sayan Dent', 'dental clinic', 'dentist', 'implant', 'orthodontics', 'teeth whitening', 'Ulaanbaatar'],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: 'Саян Дент',
    alternateName: 'Sayan Dent',
    url: SITE_URL,
    description: locale === 'mn'
      ? 'Мэргэжлийн шүдний эмнэлэг. Бүх төрлийн шүдний эмчилгээ, имплант, ортодонт.'
      : 'Professional dental clinic. All types of dental treatment, implants, orthodontics.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ulaanbaatar',
      addressCountry: 'MN',
    },
  };

  return (
    <html lang={locale}>
      <body
        className={`${montserrat.variable} ${playfair.variable} ${exo2.variable} font-sans antialiased bg-base-50 text-primary-900 `}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <ScrollToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
