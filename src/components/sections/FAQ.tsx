'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Container } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';
import { cn } from '@/lib/utils/cn';

type FaqEntry = { q: string; a: string };

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-earth-200 last:border-b-0">
      <button onClick={onToggle} className="w-full py-5 flex items-center justify-between text-left group">
        <span className="text-lg font-semibold text-primary-900 pr-4 group-hover:text-primary-600 transition-colors">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className={cn("w-5 h-5 transition-colors", isOpen ? "text-primary-600" : "text-earth-400")} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
            <p className="pb-5 text-earth-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  // Pull the localized Q/A list straight from the messages JSON. `t.raw`
  // returns the value as-is so we can iterate without per-key lookups.
  const faqItems = t.raw('items') as FaqEntry[];

  return (
    <section id="faq" className="py-16 bg-white">
      <Container>
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-earth-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-10">
            {faqItems.map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} />
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
