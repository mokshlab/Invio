import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const invoiceItemSchema = z.object({
  description: z.string({ required_error: 'Item description is required' }).trim().min(1, 'Description cannot be empty'),
  quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  rate: z.number({ required_error: 'Rate is required' }).min(0, 'Rate cannot be negative'),
  amount: z.number().optional(),
});

export const createInvoiceSchema = z.object({
  clientName: z.string({ required_error: 'Client name is required' }).trim().min(1, 'Client name cannot be empty').max(200, 'Client name cannot exceed 200 characters'),
  clientEmail: z.string().email('Invalid client email').max(254).optional().or(z.literal('')),
  clientPhone: z.string().max(30, 'Phone cannot exceed 30 characters').optional().default(''),
  clientAddress: z.string().max(500, 'Address cannot exceed 500 characters').optional().default(''),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item').max(100, 'Invoice cannot have more than 100 items'),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().default(''),
  terms: z.string().max(2000, 'Terms cannot exceed 2000 characters').optional().default('Payment is due within the specified due date.'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional().default('draft'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const validateCreateInvoice = validate(createInvoiceSchema);
export const validateUpdateInvoice = validate(updateInvoiceSchema);
