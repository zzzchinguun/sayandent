'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Container } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';
import { useState } from 'react';

const socialLinks = [
  { icon: Globe, href: '#', label: 'Website' },
];

const quickLinks = [
  { href: '#services', key: 'services' },
  { href: '#testimonials', key: 'testimonials' },
  { href: '#contact', key: 'contact' },
];

const serviceLinks = [
  'scaling', 'whitening', 'fillings', 'rootCanal', 'zirconia',
];

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('navigation');
  const tContact = useTranslations('contact.info');
  const tTreatments = useTranslations('treatments');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary-900 text-white pt-16 pb-8">
      <Container>
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/images/logo/logo-light.png"
                  alt="Sayan Dent"
                  width={176}
                  height={56}
                  className="h-14 w-auto object-contain"
                />
              </Link>
              <p className="text-primary-200 text-sm leading-relaxed">{t('description')}</p>
              <div className="flex gap-3 mt-6">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} className="w-10 h-10 rounded-full bg-primary-800 hover:bg-primary-700 flex items-center justify-center transition-colors" aria-label={social.label}>
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">{t('quickLinks')}</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.key}>
                    <a href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="text-primary-200 hover:text-white transition-colors">
                      {tNav(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">{t('services')}</h3>
              <ul className="space-y-3">
                {serviceLinks.map((key) => (
                  <li key={key}>
                    <span className="text-primary-200 text-sm">{tTreatments(`${key}.title`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">{t('contact')}</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent-400 mt-0.5 shrink-0" />
                  <span className="text-primary-200">{tContact('addressValue')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent-400 shrink-0" />
                  <span className="text-primary-200">{tContact('phoneValue')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent-400 shrink-0" />
                  <span className="text-primary-200">{tContact('emailValue')}</span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        <div className="border-t border-primary-800 pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-lg mb-1">{t('newsletter.title')}</h3>
              <p className="text-primary-300 text-sm">{t('newsletter.subtitle')}</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              {subscribed ? (
                <p className="text-accent-400 font-medium text-sm py-2">{t('newsletter.success')}</p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('newsletter.placeholder')}
                    className="flex-1 md:w-64 px-4 py-2.5 bg-primary-800 border border-primary-700 rounded-lg text-white placeholder:text-primary-400 text-sm outline-none focus:border-accent-400 transition-colors"
                  />
                  <button
                    onClick={() => { if (email.trim() && email.includes('@')) { setSubscribed(true); setEmail(''); } }}
                    className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-primary-900 rounded-lg font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t('newsletter.button')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-300 text-sm">{t('copyright')}</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-primary-300 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-primary-300 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
