'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';
import { Quote } from 'lucide-react';

function TestimonialCard({ testimonial }: { testimonial: { name: string; role: string; content: string; avatar: string } }) {
  return (
    <div className="shrink-0 w-[350px] bg-earth-100 rounded-2xl p-6 mx-3">
      <Quote className="w-10 h-10 text-primary-600 mb-4 fill-primary-600" />
      <p className="text-gray-700 text-base leading-relaxed mb-6 min-h-[100px]">{testimonial.content}</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">{testimonial.avatar}</div>
        <div>
          <p className="font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-primary-600 text-sm">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const t = useTranslations('testimonials');

  const testimonials = [
    { id: 1, name: t('items.t1.name'), role: t('items.t1.role'), content: t('items.t1.content'), avatar: t('items.t1.avatar') },
    { id: 2, name: t('items.t2.name'), role: t('items.t2.role'), content: t('items.t2.content'), avatar: t('items.t2.avatar') },
    { id: 3, name: t('items.t3.name'), role: t('items.t3.role'), content: t('items.t3.content'), avatar: t('items.t3.avatar') },
    { id: 4, name: t('items.t4.name'), role: t('items.t4.role'), content: t('items.t4.content'), avatar: t('items.t4.avatar') },
    { id: 5, name: t('items.t5.name'), role: t('items.t5.role'), content: t('items.t5.content'), avatar: t('items.t5.avatar') },
    { id: 6, name: t('items.t6.name'), role: t('items.t6.role'), content: t('items.t6.content'), avatar: t('items.t6.avatar') },
    { id: 7, name: t('items.t7.name'), role: t('items.t7.role'), content: t('items.t7.content'), avatar: t('items.t7.avatar') },
    { id: 8, name: t('items.t8.name'), role: t('items.t8.role'), content: t('items.t8.content'), avatar: t('items.t8.avatar') },
  ];

  const duplicated = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-16 bg-white overflow-hidden">
      <Container>
        <ScrollReveal className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">{t('badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
          <div className="w-24 h-1 bg-primary-600 mx-auto mt-6" />
        </ScrollReveal>
      </Container>

      <div className="mt-16 relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex" style={{ animation: 'scroll-left 40s linear infinite', width: 'max-content' }}>
          {duplicated.map((testimonial, index) => (
            <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      <div className="mt-6 relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex" style={{ animation: 'scroll-right 40s linear infinite', width: 'max-content' }}>
          {duplicated.map((testimonial, index) => (
            <TestimonialCard key={`reverse-${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
