import { describe, it, expect } from 'vitest';
import { createInvoiceSchema, updateInvoiceSchema } from '../../validators/invoiceValidator.js';

const validItem = { description: 'Web design', quantity: 1, rate: 500 };

const validInvoice = {
  clientName: 'Acme Corp',
  items: [validItem],
};

describe('createInvoiceSchema', () => {
  it('accepts minimal valid input', () => {
    const result = createInvoiceSchema.parse(validInvoice);
    expect(result.clientName).toBe('Acme Corp');
    expect(result.status).toBe('draft');
    expect(result.taxRate).toBe(0);
    expect(result.discount).toBe(0);
  });

  it('accepts full input', () => {
    const full = {
      ...validInvoice,
      clientEmail: 'acme@test.com',
      clientPhone: '+1234567890',
      clientAddress: '123 Main St',
      issueDate: '2025-01-01',
      dueDate: '2025-02-01',
      taxRate: 10,
      discount: 50,
      notes: 'Thank you',
      terms: 'Net 30',
      status: 'sent',
    };
    expect(() => createInvoiceSchema.parse(full)).not.toThrow();
  });

  it('rejects missing clientName', () => {
    const result = createInvoiceSchema.safeParse({ items: [validItem] });
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = createInvoiceSchema.safeParse({ clientName: 'X', items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 100 items', () => {
    const items = Array.from({ length: 101 }, () => validItem);
    const result = createInvoiceSchema.safeParse({ clientName: 'X', items });
    expect(result.success).toBe(false);
  });

  it('rejects clientName over 200 chars', () => {
    const result = createInvoiceSchema.safeParse({
      clientName: 'A'.repeat(201),
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes over 2000 chars', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      notes: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects terms over 2000 chars', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      terms: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects clientPhone over 30 chars', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      clientPhone: '1'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = createInvoiceSchema.safeParse({
      clientName: 'X',
      items: [{ description: 'Item', quantity: -1, rate: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative rate', () => {
    const result = createInvoiceSchema.safeParse({
      clientName: 'X',
      items: [{ description: 'Item', quantity: 1, rate: -5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects taxRate over 100', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      taxRate: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      status: 'cancelled',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for clientEmail', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      clientEmail: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid clientEmail', () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      clientEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateInvoiceSchema', () => {
  it('accepts empty body (all fields optional)', () => {
    const result = updateInvoiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = updateInvoiceSchema.safeParse({ clientName: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('still validates constraints on provided fields', () => {
    const result = updateInvoiceSchema.safeParse({ clientName: '' });
    expect(result.success).toBe(false);
  });
});
