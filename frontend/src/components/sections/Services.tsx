'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { ArrowRight, Stethoscope, ScanLine, Sparkles, Wrench } from 'lucide-react';
import { Container } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';

gsap.registerPlugin(ScrollTrigger);

const serviceCategories = [
  {
    key: 'oral',
    color: '#852464',
    icon: Stethoscope,
    image: '/images/services/oral.jpg',
    treatmentSlugs: ['checkup', 'scaling', 'airflow', 'fluoride'],
  },
  {
    key: 'xray',
    color: '#6e1d53',
    icon: ScanLine,
    image: '/images/services/xray.jpg',
    treatmentSlugs: ['panoramic', 'periapical'],
  },
  {
    key: 'cosmetic',
    color: '#B68E4E',
    icon: Sparkles,
    image: '/images/services/cosmetic.jpg',
    treatmentSlugs: ['whiteningOffice', 'whiteningHome', 'veneers', 'ribbond'],
  },
  {
    key: 'restorative',
    color: '#9a7340',
    icon: Wrench,
    image: '/images/services/restorative.jpg',
    treatmentSlugs: ['fillings', 'rootCanal', 'crowns', 'emax'],
  },
] as const;

function ServiceCard({
  service,
  index,
  t,
}: {
  service: (typeof serviceCategories)[number];
  index: number;
  t: ReturnType<typeof useTranslations<'services'>>;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;

  return (
    <div
      className="service-card group rounded-2xl overflow-hidden shadow-sm border border-earth-200 hover:border-earth-300 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-3/2 overflow-hidden">
        <Image
          src={service.image}
          alt=""
          fill
          sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 mix-blend-multiply opacity-30"
          style={{ backgroundColor: service.color }}
        />
        <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
          <Icon className="w-5 h-5" style={{ color: service.color }} />
        </div>
      </div>

      <div className="p-5" style={{ backgroundColor: service.color }}>
        <span className="text-white/50 text-xs font-medium tracking-wider block mb-1">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-base md:text-lg font-bold text-white mb-1.5">
          {t(`${service.key}.title` as never)}
        </h3>
        <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5">
          <span className="text-white/60 text-xs">&rarr;</span>
          <span className="text-white font-medium text-xs">
            {t(`${service.key}.outcome` as never)}
          </span>
        </div>

        <motion.div
          initial={false}
          animate={{ height: hovered ? 'auto' : 0, opacity: hovered ? 1 : 0, marginTop: hovered ? 12 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-2">
            {service.treatmentSlugs.map((slug) => (
              <div key={slug} className="group/link flex items-center gap-3 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2.5 transition-all">
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-white">
                    {t(`${service.key}.treatments.${slug}.name` as never)}
                  </span>
                  <span className="block text-[11px] text-white/60">
                    {t(`${service.key}.treatments.${slug}.desc` as never)}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover/link:text-white transition-all shrink-0" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const DIAGONAL_OFFSETS = [0, 40, 80, 120];

export function Services() {
  const t = useTranslations('services');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.service-card');
      gsap.from(cards, {
        y: () => window.innerHeight * 0.35,
        opacity: 0,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="services" ref={sectionRef} className="bg-white py-16 md:py-24">
      <Container>
        <ScrollReveal>
          <div className="text-right mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
              <span className="text-primary-900">{t('titleText1')}</span>{' '}
              <span className="text-earth-300">&mdash;</span>{' '}
              <span className="text-primary-900">{t('titleText2')}</span>
            </h2>
            <p className="text-sm md:text-base text-earth-500 max-w-xl ml-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceCategories.map((service, index) => (
            <div key={service.key} style={{ marginTop: `${DIAGONAL_OFFSETS[index]}px` }} className="hidden lg:block">
              <ServiceCard service={service} index={index} t={t} />
            </div>
          ))}
          {serviceCategories.map((service, index) => (
            <div key={service.key} className="lg:hidden">
              <ServiceCard service={service} index={index} t={t} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
