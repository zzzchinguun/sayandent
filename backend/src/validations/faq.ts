import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['mn', 'en']),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const faqCreateSchema = z.object({
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(translationSchema).min(1, 'At least one translation is required'),
});

export const faqUpdateSchema = faqCreateSchema.partial();

export type FAQCreateInput = z.infer<typeof faqCreateSchema>;
export type FAQUpdateInput = z.infer<typeof faqUpdateSchema>;
