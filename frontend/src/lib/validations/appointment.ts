import { z } from 'zod';

export const appointmentStatusEnum = z.enum([
  'booked',
  'arrived',
  'examined',
  'paid',
  'cancelled_by_patient',
  'cancelled_by_doctor',
]);

export const appointmentSourceEnum = z.enum(['online', 'manual']);

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
  status: appointmentStatusEnum.optional(),
  source: appointmentSourceEnum.optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  doctorId: z.string().uuid().nullable().optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
