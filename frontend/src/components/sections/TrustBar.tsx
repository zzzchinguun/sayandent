'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

const partners = [
  { name: 'Osstem', src: '/images/partners/osstem.png', href: 'https://mn.osstem.com' },
  { name: 'ROOTT', src: '/images/partners/roott.png', href: 'https://roottimplants.co.uk' },
  { name: 'Vatech', src: '/images/partners/vatech.png', href: 'https://vatechmongolia.com' },
];

export function TrustBar() {
  const t = useTranslations('trustBar');

  return (
    <section className="bg-white border-y border-earth-200">
      <div className="py-10">
        <p className="text-center text-xs text-earth-400 mb-8 uppercase tracking-[0.2em] font-medium">
          {t('title')}
        </p>

        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 md:gap-x-24">
            {partners.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={p.name}
                className="relative h-14 w-32 md:h-16 md:w-40 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all"
              >
                <Image
                  src={p.src}
                  alt={p.name}
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
