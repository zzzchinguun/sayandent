import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['mn', 'en']),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  content: z.string().min(1, 'Content is required'),
  avatar: z.string().optional(),
});

export const testimonialCreateSchema = z.object({
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(translationSchema).min(1, 'At least one translation is required'),
});

export const testimonialUpdateSchema = testimonialCreateSchema.partial();

export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>;
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
