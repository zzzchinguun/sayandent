'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils/cn';

const navLinks = [
  { href: '#hero', key: 'home' },
  { href: '#services', key: 'services' },
  { href: '#appointment', key: 'appointment' },
  { href: '#contact', key: 'contact' },
] as const;

function MenuIcon({ isOpen, isScrolled }: { isOpen: boolean; isScrolled: boolean }) {
  const lineColor = isOpen ? 'bg-white' : 'bg-primary-800';

  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <motion.span
        className={cn('absolute h-0.5 w-6 rounded-full transition-colors', lineColor)}
        animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 0 : -8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.span
        className={cn('absolute h-0.5 w-6 rounded-full transition-colors', lineColor)}
        animate={{ opacity: isOpen ? 0 : 1, scaleX: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className={cn('absolute h-0.5 w-6 rounded-full transition-colors', lineColor)}
        animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? 0 : 8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

const menuOverlayVariants = {
  hidden: { opacity: 0, transition: { duration: 0.3, when: 'afterChildren' } },
  visible: { opacity: 1, transition: { duration: 0.3, when: 'beforeChildren', staggerChildren: 0.08, delayChildren: 0.1 } },
};

const menuItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function Header() {
  const t = useTranslations('navigation');
  const tAppointment = useTranslations('appointment');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isSubpage = pathname !== '/' && !pathname.match(/^\/(mn|en)\/?$/);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 50);

      if (currentY > 200) {
        // Scrolling down → hide, scrolling up → show
        setIsHidden(currentY > lastScrollY.current);
      } else {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showSolid = isSubpage || (isScrolled && !isMenuOpen);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const scrollToAppointment = () => {
    const element = document.querySelector('#appointment');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          showSolid ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        )}
        initial={{ y: -100 }}
        animate={{ y: isHidden && !isMenuOpen ? -100 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1500px]">
          <nav className="flex items-center justify-between h-20">
            <Link href="/" className="relative z-50">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative w-[200px] h-[200px] md:w-[245px] md:h-[245px]">
                <Image
                  src="/images/logo/logo-dark.png"
                  alt="Sayan Dent"
                  fill
                  sizes="245px"
                  className="object-contain"
                  priority
                />
              </motion.div>
            </Link>

            <div className="flex items-center gap-4 relative z-50">
              <motion.div
                animate={{ opacity: isMenuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-3"
              >
                {isSubpage ? (
                  <Link href="/#appointment">
                    <Button variant="primary" size="md">{tAppointment('title')}</Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={scrollToAppointment}
                  >
                    {tAppointment('title')}
                  </Button>
                )}
                <Link href="/admin/login">
                  <Button variant="outline" size="md">{t('login')}</Button>
                </Link>
              </motion.div>

              <motion.button
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                  isMenuOpen ? 'bg-white/20' : showSolid ? 'bg-primary-50 hover:bg-primary-100' : 'bg-white/10 hover:bg-white/20'
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <MenuIcon isOpen={isMenuOpen} isScrolled={showSolid} />
              </motion.button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div className="fixed inset-0 z-40" variants={menuOverlayVariants} initial="hidden" animate="visible" exit="hidden">
            <motion.div className="absolute inset-0 bg-linear-to-br from-primary-900 via-primary-800 to-primary-950" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
            <motion.div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.6, delay: 0.1 }} />
            <motion.div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.6, delay: 0.2 }} />

            <div className="relative h-full flex flex-col items-center justify-center px-6">
              <motion.nav className="flex flex-col items-center gap-6 md:gap-8">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.key}
                    href={isSubpage ? `/${link.href}` : link.href}
                    onClick={isSubpage ? undefined : (e) => scrollToSection(e, link.href)}
                    variants={menuItemVariants}
                    className="text-3xl md:text-5xl lg:text-6xl font-bold text-white hover:text-accent-300 transition-colors relative group"
                  >
                    {t(link.key)}
                    <motion.span className="absolute -bottom-2 left-0 h-1 bg-accent-400 rounded-full" initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.3 }} />
                  </motion.a>
                ))}
              </motion.nav>

              <motion.div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4" variants={menuItemVariants}>
                <LanguageSwitcher />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
