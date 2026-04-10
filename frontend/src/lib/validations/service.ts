import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['mn', 'en']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export const serviceCreateSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(translationSchema).min(1, 'At least one translation is required'),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
