import { z } from 'zod';
import { validate } from './authValidator.js';

const invoiceItemSchema = z.object({
  description: z.string({ required_error: 'Item description is required' }).trim().min(1, 'Description cannot be empty'),
  quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  rate: z.number({ required_error: 'Rate is required' }).min(0, 'Rate cannot be negative'),
  amount: z.number().optional(),
});

export const createInvoiceSchema = z.object({
  clientName: z.string({ required_error: 'Client name is required' }).trim().min(1, 'Client name cannot be empty'),
  clientEmail: z.string().email('Invalid client email').optional().or(z.literal('')),
  clientPhone: z.string().optional().default(''),
  clientAddress: z.string().optional().default(''),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(''),
  terms: z.string().optional().default('Payment is due within the specified due date.'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional().default('draft'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const validateCreateInvoice = validate(createInvoiceSchema);
export const validateUpdateInvoice = validate(updateInvoiceSchema);
