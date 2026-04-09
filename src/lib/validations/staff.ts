import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['mn', 'en']),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  bio: z.string().min(1, 'Bio is required'),
});

export const staffCreateSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(translationSchema).min(1, 'At least one translation is required'),
});

export const staffUpdateSchema = staffCreateSchema.partial();

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
