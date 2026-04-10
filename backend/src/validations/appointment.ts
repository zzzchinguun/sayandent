import { z } from 'zod';

export const appointmentCreateSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(8, 'Required'),
  email: z.string().email('Invalid email'),
  preferredDate: z.string().min(1, 'Required'),
  preferredTime: z.string().min(1, 'Required'),
  serviceType: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

export const appointmentUpdateSchema = appointmentCreateSchema.partial().extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
