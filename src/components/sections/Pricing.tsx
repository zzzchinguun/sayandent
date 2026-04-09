'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, ScanLine, Sparkles, Wrench, Baby } from 'lucide-react';
import { Container } from '@/components/ui';

/**
 * Real pricing for Sayan Dent — sourced from the clinic.
 * Stored inline for now; if it needs to be admin-managed, lift it into the
 * DB with a `pricing_categories` / `pricing_items` table pair.
 */
type PricingItem = { mn: string; en: string; price: number };
type PricingCategory = {
  key: string;
  mn: string;
  en: string;
  icon: typeof Stethoscope;
  color: string;
  items: PricingItem[];
};

const PRICING: PricingCategory[] = [
  {
    key: 'oral',
    mn: 'Нүүр амны эмчилгээ',
    en: 'Oral Care',
    icon: Stethoscope,
    color: '#852464',
    items: [
      { mn: 'Үзлэг, зөвлөгөө', en: 'Consultation', price: 15000 },
      { mn: 'Шүдний чулуу цэвэрлэгээ, өнгөлгөө', en: 'Scaling & polishing', price: 80000 },
      { mn: 'Airflow', en: 'Airflow cleaning', price: 140000 },
      { mn: 'Фторт түрхлэг', en: 'Fluoride treatment', price: 40000 },
      { mn: 'Хэсгийн мэдээ алдуулалт', en: 'Local anesthesia', price: 10000 },
    ],
  },
  {
    key: 'xray',
    mn: 'Шүдний рентген зураг',
    en: 'Dental X-Ray',
    icon: ScanLine,
    color: '#6e1d53',
    items: [
      { mn: 'Дэлгэмэл зураг', en: 'Panoramic X-ray', price: 50000 },
      { mn: 'Хэсгийн зураг', en: 'Periapical X-ray', price: 10000 },
    ],
  },
  {
    key: 'cosmetic',
    mn: 'Гоо сайхны эмчилгээ',
    en: 'Cosmetic Dentistry',
    icon: Sparkles,
    color: '#B68E4E',
    items: [
      { mn: 'Шүд цайруулалт — оффис', en: 'In-office whitening', price: 300000 },
      { mn: 'Шүд цайруулалт — гэрт', en: 'At-home whitening', price: 300000 },
      { mn: 'Шүдний паалан', en: 'Dental veneers', price: 140000 },
      { mn: 'Риббонд шүдэлбэр', en: 'Ribbond bridge', price: 300000 },
    ],
  },
  {
    key: 'restorative',
    mn: 'Нөхөн сэргээх эмчилгээ',
    en: 'Restorative Dentistry',
    icon: Wrench,
    color: '#9a7340',
    items: [
      { mn: 'Шүдний ломбо — өнгөц', en: 'Filling — surface', price: 70000 },
      { mn: 'Шүдний ломбо — дунд', en: 'Filling — medium', price: 90000 },
      { mn: 'Шүдний ломбо — гүн', en: 'Filling — deep', price: 110000 },
      { mn: 'Риббондтой ломбо', en: 'Ribbond filling', price: 150000 },
      { mn: 'Шүдний сувгийн эмчилгээ — үүдэн', en: 'Root canal — anterior', price: 250000 },
      { mn: 'Шүдний сувгийн эмчилгээ — араа', en: 'Root canal — molar', price: 350000 },
      { mn: 'Шүдний нүүрэвч', en: 'Dental veneer', price: 880000 },
      { mn: 'Emax нүүрэвч', en: 'Emax veneer', price: 1200000 },
      { mn: 'Шүдний циркон бүрээс', en: 'Zirconia crown', price: 880000 },
      { mn: 'Шүдний металл шаазан бүрээс', en: 'Metal-ceramic crown', price: 550000 },
      { mn: 'Бүрээс наах', en: 'Crown cementation', price: 60000 },
      { mn: 'Металл голонцор', en: 'Metal post', price: 150000 },
    ],
  },
  {
    key: 'pediatric',
    mn: 'Хүүхдийн шүдний эмчилгээ',
    en: "Children's Dentistry",
    icon: Baby,
    color: '#852464',
    items: [
      { mn: 'Сувгийн эмчилгээ — үүдэн шүд', en: 'Root canal — anterior', price: 60000 },
      { mn: 'Сувгийн эмчилгээ — араа шүд', en: 'Root canal — molar', price: 90000 },
      { mn: 'Эмчилгээний жийргэвч', en: 'Therapeutic liner', price: 20000 },
      { mn: 'Тусгаарлах жийргэвч', en: 'Insulating liner', price: 20000 },
      { mn: 'Мэдрэл үхжүүлэх эм', en: 'Pulp devitalizer', price: 20000 },
      { mn: 'Ломбо — өнгөц', en: 'Filling — surface', price: 35000 },
      { mn: 'Ломбо — дунд', en: 'Filling — medium', price: 40000 },
      { mn: 'Ломбо — гүн', en: 'Filling — deep', price: 50000 },
    ],
  },
];

function formatPrice(price: number, locale: string) {
  const formatted = new Intl.NumberFormat('mn-MN').format(price);
  return locale === 'mn' ? `${formatted}₮` : `₮${formatted}`;
}

export function Pricing() {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const [activeKey, setActiveKey] = useState<string>(PRICING[0].key);

  const active = PRICING.find((c) => c.key === activeKey) ?? PRICING[0];

  return (
    <section id="pricing" className="bg-base-50 py-20 md:py-28">
      <Container>
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] text-accent-500 uppercase mb-3">
            {t('eyebrow')}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="text-primary-600">{t('titleNum')}</span>{' '}
            <span className="text-primary-900">{t('titleText')}</span>
          </h2>
          <p className="text-earth-500 text-base md:text-lg max-w-2xl mx-auto mt-4">
            {t('subtitle')}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
          {PRICING.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.key === activeKey;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveKey(cat.key)}
                className={`flex items-center gap-2 px-4 md:px-5 py-3 rounded-full text-sm md:text-base font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'bg-white text-primary-900 hover:bg-primary-50 border border-earth-200'
                }`}
                style={isActive ? { backgroundColor: cat.color } : undefined}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span>{locale === 'mn' ? cat.mn : cat.en}</span>
              </button>
            );
          })}
        </div>

        {/* Active category items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-earth-100"
          >
            <div
              className="px-6 md:px-8 py-5 flex items-center gap-3"
              style={{ backgroundColor: active.color }}
            >
              <active.icon className="w-6 h-6 text-white" />
              <h3 className="text-lg md:text-xl font-bold text-white">
                {locale === 'mn' ? active.mn : active.en}
              </h3>
            </div>

            <ul className="divide-y divide-earth-100">
              {active.items.map((item, idx) => (
                <motion.li
                  key={`${active.key}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="flex items-center justify-between px-6 md:px-8 py-4 hover:bg-base-50 transition-colors"
                >
                  <span className="text-primary-900 text-sm md:text-base font-medium pr-4">
                    {locale === 'mn' ? item.mn : item.en}
                  </span>
                  <span
                    className="text-base md:text-lg font-bold whitespace-nowrap"
                    style={{ color: active.color }}
                  >
                    {formatPrice(item.price, locale)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

      </Container>
    </section>
  );
}
