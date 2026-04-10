'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui';

const treatments = [
  { key: 'scaling', color: '#852464' },
  { key: 'airflow', color: '#6e1d53' },
  { key: 'fillings', color: '#852464' },
  { key: 'veneers', color: '#6e1d53' },
  { key: 'rootCanal', color: '#852464' },
  { key: 'zirconia', color: '#B68E4E' },
  { key: 'emax', color: '#9a7340' },
] as const;

const CARD_WIDTH_VW = 22;
const CARD_COUNT = treatments.length;

function TreatmentFlipCard({
  treatment,
  index,
  t,
}: {
  treatment: (typeof treatments)[number];
  index: number;
  t: ReturnType<typeof useTranslations<'treatments'>>;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="shrink-0 px-[1vw] w-[22vw] aspect-730/850"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div style={{ perspective: '1200px' }} className="h-full">
        <motion.div
          className="relative w-full h-full rounded-2xl"
          style={{ transformStyle: 'preserve-3d', backgroundColor: treatment.color }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* FRONT — title/description at top, image anchored bottom */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border border-earth-200 bg-white flex flex-col"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-earth-300 text-xs font-medium tracking-wider">{String(index + 1).padStart(2, '0')}</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: treatment.color }} />
              </div>
              <h4 className="font-bold text-primary-900 text-base mb-1.5 leading-snug">{t(`${treatment.key}.title`)}</h4>
              <p className="text-earth-500 text-xs leading-relaxed line-clamp-3">{t(`${treatment.key}.description`)}</p>
            </div>
            <div className="relative flex-1">
              <Image
                src={`/images/treatments/${treatment.key}.png`}
                alt={t(`${treatment.key}.title`)}
                fill
                sizes="320px"
                className="object-contain object-bottom"
              />
            </div>
          </div>

          {/* BACK — text details */}
          <div className="absolute inset-0 rounded-2xl p-5 flex flex-col text-white" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: treatment.color }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium tracking-wider">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-white/50 text-xs">&times; {t('back')}</span>
            </div>
            <h4 className="font-bold text-sm mb-2 leading-snug">{t(`${treatment.key}.title`)}</h4>
            <p className="text-white/80 text-xs leading-relaxed mb-3 line-clamp-3">{t(`${treatment.key}.description`)}</p>
            <div className="mt-auto">
              <span className="text-white/50 text-[10px] uppercase tracking-wider">{t('outcomes')}</span>
              <div className="flex flex-col gap-1 mt-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-white text-[11px] font-medium">{t(`${treatment.key}.outcome${n}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function HorizontalShowcase({ t }: { t: ReturnType<typeof useTranslations<'treatments'>> }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ totalWidth: 0, viewWidth: 1200 });

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      setDims({ totalWidth: CARD_COUNT * (vw * CARD_WIDTH_VW / 100) + vw * 0.15, viewWidth: vw });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const maxTranslate = Math.max(0, dims.totalWidth - dims.viewWidth);
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -maxTranslate]);
  const cardX = useSpring(rawX, { stiffness: 80, damping: 25, restDelta: 0.5 });
  const scrollbarScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={sectionRef} style={{ height: dims.totalWidth > 0 ? `${dims.totalWidth}px` : '300vh' }} className="relative">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-white flex flex-col">
        <div className="text-center pt-24 pb-6 relative z-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight tracking-tight">
            <span className="text-primary-900">{t('titleText')}</span>
          </h2>
          <p className="text-sm md:text-base text-earth-500 max-w-2xl mx-auto">{t('subtitle')}</p>
          <a href="#pricing" className="inline-block mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            {t('viewAll')} &rarr;
          </a>
        </div>

        <motion.div className="flex-1 relative z-10" style={{ x: cardX }}>
          <div className="flex h-full items-start pt-4 pl-[5vw]">
            {treatments.map((treatment, i) => (
              <TreatmentFlipCard key={treatment.key} treatment={treatment} index={i} t={t} />
            ))}
            <div className="shrink-0" style={{ width: '15vw' }} />
          </div>
        </motion.div>

        <div className="absolute bottom-[6%] left-[20%] right-[20%] h-px bg-earth-200 z-30">
          <motion.div className="absolute inset-0 bg-primary-600 origin-left" style={{ scaleX: scrollbarScale }} />
        </div>
      </div>
    </div>
  );
}

function MobileCard({ treatment, title, description, learnMore, index }: {
  treatment: typeof treatments[number]; title: string; description: string; learnMore: string; index: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 group border border-earth-200 hover:border-primary-300 transition-colors"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-earth-300 text-xs font-medium tracking-wider">{String(index + 1).padStart(2, '0')}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: treatment.color }} />
      </div>
      <h4 className="font-semibold text-primary-900 text-sm mb-1.5">{title}</h4>
      <p className="text-xs text-earth-500 line-clamp-2 mb-3">{description}</p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
        {learnMore} <ArrowRight className="w-3 h-3" />
      </span>
    </motion.div>
  );
}

export function Treatments() {
  const t = useTranslations('treatments');

  return (
    <section id="treatments">
      <div className="hidden lg:block">
        <HorizontalShowcase t={t} />
      </div>

      <div className="lg:hidden bg-white py-6">
        <Container>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold mb-2 leading-tight tracking-tight">
              <span className="text-primary-900">{t('titleText')}</span>
            </h2>
            <p className="text-sm text-earth-500">{t('subtitle')}</p>
            <a href="#pricing" className="inline-block mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700">
              {t('viewAll')} &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {treatments.map((treatment, index) => (
              <MobileCard key={treatment.key} treatment={treatment} title={t(`${treatment.key}.title`)} description={t(`${treatment.key}.description`)} learnMore={t('learnMore')} index={index} />
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
