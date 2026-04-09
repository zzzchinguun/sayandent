'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { Container, Button, Input, Textarea } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: MapPin, key: 'address', valueKey: 'addressValue' },
  { icon: Phone, key: 'phone', valueKey: 'phoneValue' },
  { icon: Mail, key: 'email', valueKey: 'emailValue' },
  { icon: Clock, key: 'hours', valueKey: 'hoursValue' },
] as const;

export function Contact() {
  const t = useTranslations('contact');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to send');
      setIsSubmitted(true);
      reset();
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      alert(t('form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 bg-white">
      <Container>
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-earth-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ScrollReveal variant="fadeLeft">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {isSubmitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-accent-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-primary-900 mb-2">{t('form.success')}</h3>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Input label={t('form.name')} id="name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
                  <Input label={t('form.email')} id="email" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
                  <Input label={t('form.phone')} id="phone" type="tel" placeholder="+976 9999 9999" {...register('phone')} />
                  <Textarea label={t('form.message')} id="message" placeholder="Your message..." rows={5} error={errors.message?.message} {...register('message')} />
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <>{t('form.submit')}<Send className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeRight">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((info) => (
                  <motion.div key={info.key} className="bg-white rounded-xl p-6 shadow-md" whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                      <info.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-primary-900 mb-1">{t(`info.${info.key}`)}</h3>
                    <p className="text-earth-600 text-sm">{t(`info.${info.valueKey}`)}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-primary-600 rounded-2xl p-8 text-center text-white">
                <h3 className="text-xl font-bold mb-2">Emergency Dental Care</h3>
                <p className="text-primary-200 text-sm mb-4">Need urgent dental attention? Call us now.</p>
                <a href="tel:+97670106779" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-6 py-3 rounded-full hover:bg-primary-50 transition-colors">
                  <Phone className="w-5 h-5" /> +976 7010 6779
                </a>
              </div>

              {/* Google Maps embed — Sayan Dent, Peace Tower */}
              <div className="rounded-2xl overflow-hidden shadow-lg border border-earth-100">
                <iframe
                  title="Sayan Dent location"
                  src="https://www.google.com/maps?q=Peace+Tower+Peace+Avenue+54+Chingeltei+Ulaanbaatar&output=embed"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
