'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarCheck,
  CheckCircle,
  User,
  Clock,
  FileText,
  Send,
  Check,
} from 'lucide-react';
import { Container, Button, Input, Textarea } from '@/components/ui';
import { ScrollReveal } from '@/components/animations';

const appointmentSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(8, 'Required'),
  email: z.string().email('Invalid email'),
  preferredDate: z.string().min(1, 'Required'),
  preferredTime: z.string().min(1, 'Required'),
  serviceType: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const steps = [
  { key: 'patient', icon: User, fields: ['fullName', 'phone', 'email'] },
  { key: 'schedule', icon: Clock, fields: ['preferredDate', 'preferredTime', 'serviceType'] },
  { key: 'additional', icon: FileText, fields: [] },
  { key: 'submit', icon: Send, fields: [] },
] as const;

export function Appointment() {
  const t = useTranslations('appointment');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const watchedValues = watch();

  const getStepCompletion = useCallback((stepIndex: number): boolean => {
    const step = steps[stepIndex];
    if (step.key === 'submit' || step.key === 'additional') return step.key === 'additional' ? true : false;
    return step.fields.every((field) => {
      const value = watchedValues[field as keyof AppointmentFormData];
      return value && String(value).length > 0;
    });
  }, [watchedValues]);

  useEffect(() => {
    if (isSubmitted) return;
    for (let i = 0; i < steps.length - 1; i++) {
      if (!getStepCompletion(i)) { setActiveStep(i); return; }
    }
    setActiveStep(steps.length - 1);
  }, [watchedValues, isSubmitted, getStepCompletion]);

  const totalRequired = steps.slice(0, 2).reduce((sum, s) => sum + s.fields.length, 0);
  const filledCount = steps.slice(0, 2).reduce((sum, step) => {
    return sum + step.fields.filter((field) => {
      const value = watchedValues[field as keyof AppointmentFormData];
      return value && String(value).length > 0;
    }).length;
  }, 0);
  const progressPercent = Math.round((filledCount / totalRequired) * 100);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to submit');
      setIsSubmitted(true);
      reset();
    } catch {
      alert(t('form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="appointment" className="py-16 bg-primary-600 relative overflow-hidden">
      <div className="absolute top-20 -left-32 w-96 h-96 bg-primary-500/20 rounded-full" style={{ animation: 'float-custom 8s ease-in-out infinite' }} />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-accent-500/15 rounded-full" style={{ animation: 'float-custom 6s ease-in-out 1s infinite' }} />

      <Container className="relative z-10">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('title')}</h2>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto">{t('subtitle')}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left progress panel */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <ScrollReveal>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/80 text-sm font-medium">{t('progressLabel')}</p>
                    <span className="text-accent-400 font-bold text-lg">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
                    <motion.div className="h-full bg-accent-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                  </div>
                  <div className="space-y-1">
                    {steps.map((step, index) => {
                      const isActive = activeStep === index;
                      const isCompleted = index < steps.length - 1 && getStepCompletion(index);
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <motion.div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted ? 'bg-accent-400 border-accent-400' : isActive ? 'bg-white/20 border-accent-400' : 'bg-white/5 border-white/20'}`}
                              animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                            >
                              <AnimatePresence mode="wait">
                                {isCompleted ? (
                                  <motion.div key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.3 }}>
                                    <Check className="w-4 h-4 text-primary-900" />
                                  </motion.div>
                                ) : (
                                  <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-accent-400' : 'text-white/40'}`} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            {index < steps.length - 1 && <div className={`w-0.5 h-5 transition-colors duration-300 ${isCompleted ? 'bg-accent-400' : 'bg-white/10'}`} />}
                          </div>
                          <motion.p className={`text-sm font-medium transition-colors duration-300 -mt-5 ${isCompleted ? 'text-accent-400' : isActive ? 'text-white' : 'text-white/40'}`} animate={isActive ? { x: [0, 4, 0] } : { x: 0 }} transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}>
                            {t(`steps.${step.key}`)}
                          </motion.p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Mobile progress */}
          <div className="lg:hidden">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/80 text-sm font-medium">{t('progressLabel')}</p>
                <span className="text-accent-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-accent-400 rounded-full" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
              </div>
            </div>
          </div>

          {/* Form */}
          <ScrollReveal className="lg:col-span-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              {isSubmitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-accent-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-primary-900 mb-2">{t('form.success')}</h3>
                  <p className="text-earth-600 mb-8">{t('form.successDesc')}</p>
                  <div className="max-w-sm mx-auto text-left space-y-4 mb-8">
                    {['step1', 'step2', 'step3'].map((step, i) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-primary-600 text-sm font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-900">{t(`form.nextSteps.${step}.title`)}</p>
                          <p className="text-xs text-earth-500">{t(`form.nextSteps.${step}.desc`)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-2" onClick={() => setIsSubmitted(false)}>{t('form.submitAnother')}</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Patient Info */}
                  <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><User className="w-4 h-4 text-primary-600" /></div>
                      <h3 className="text-lg font-semibold text-primary-900">{t('patientInfo')}</h3>
                      {getStepCompletion(0) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto"><Check className="w-5 h-5 text-accent-500" /></motion.div>}
                    </div>
                    <div className="space-y-4">
                      <Input label={t('form.fullName')} id="fullName" placeholder={t('form.fullNamePlaceholder')} error={errors.fullName?.message} {...register('fullName')} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('form.phone')} id="phone" type="tel" placeholder={t('form.phonePlaceholder')} error={errors.phone?.message} {...register('phone')} />
                        <Input label={t('form.email')} id="email" type="email" placeholder={t('form.emailPlaceholder')} error={errors.email?.message} {...register('email')} />
                      </div>
                    </div>
                  </motion.div>

                  <div className="border-t border-earth-100" />

                  {/* Schedule */}
                  <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><Clock className="w-4 h-4 text-primary-600" /></div>
                      <h3 className="text-lg font-semibold text-primary-900">{t('scheduleInfo')}</h3>
                      {getStepCompletion(1) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto"><Check className="w-5 h-5 text-accent-500" /></motion.div>}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label={t('form.preferredDate')} id="preferredDate" type="date" error={errors.preferredDate?.message} {...register('preferredDate')} />
                        <Input label={t('form.preferredTime')} id="preferredTime" type="time" error={errors.preferredTime?.message} {...register('preferredTime')} />
                      </div>
                      <div className="w-full">
                        <label htmlFor="serviceType" className="block text-sm font-medium text-primary-900 mb-2">{t('form.serviceType')}</label>
                        <select id="serviceType" {...register('serviceType')} className="w-full rounded-lg border border-earth-200 bg-white px-4 py-3 text-primary-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none hover:border-earth-300">
                          <option value="">--</option>
                          {['cleaning', 'filling', 'whitening', 'implant', 'orthodontics', 'rootCanal', 'crown', 'extraction', 'pediatric', 'other'].map((opt) => (
                            <option key={opt} value={opt}>{t(`form.serviceOptions.${opt}`)}</option>
                          ))}
                        </select>
                        {errors.serviceType && <p className="mt-1 text-sm text-red-500">{errors.serviceType.message}</p>}
                      </div>
                    </div>
                  </motion.div>

                  <div className="border-t border-earth-100" />

                  {/* Notes */}
                  <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><FileText className="w-4 h-4 text-primary-600" /></div>
                      <h3 className="text-lg font-semibold text-primary-900">{t('additionalInfo')}</h3>
                    </div>
                    <Textarea label={t('form.notes')} id="notes" placeholder={t('form.notesPlaceholder')} rows={3} {...register('notes')} />
                  </motion.div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <><CalendarCheck className="mr-2 w-5 h-5" />{t('form.submit')}</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
