import { z } from 'zod';

// POST /api/ai/generate-invoice
export const generateInvoiceSchema = z.object({
  text: z
    .string({ required_error: 'Text is required' })
    .trim()
    .min(10, 'Please provide at least 10 characters of text to analyse')
    .max(5000, 'Text cannot exceed 5000 characters'),
});

// POST /api/ai/payment-reminder
export const paymentReminderSchema = z.object({
  invoiceId: z
    .string({ required_error: 'Invoice ID is required' })
    .trim()
    .min(1, 'Invoice ID is required'),
  tone: z
    .enum(['friendly', 'professional', 'urgent'], {
      errorMap: () => ({ message: 'Tone must be one of: friendly, professional, urgent' }),
    })
    .default('professional'),
});

// POST /api/ai/send-reminder
export const sendReminderSchema = z.object({
  invoiceId: z
    .string({ required_error: 'Invoice ID is required' })
    .trim()
    .min(1, 'Invoice ID is required'),
  reminderText: z
    .string({ required_error: 'Reminder text is required' })
    .trim()
    .min(1, 'Reminder text is required')
    .max(5000, 'Reminder text cannot exceed 5000 characters'),
});
