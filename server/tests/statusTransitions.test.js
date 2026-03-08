import { describe, it, expect } from 'vitest';

/**
 * Tests the status transition rules enforced in invoiceController.updateInvoice.
 * This mirrors the ALLOWED_TRANSITIONS map from the controller to ensure
 * the business logic is intentional and documented.
 */

const ALLOWED_TRANSITIONS = {
  draft: ['sent'],
  sent: ['paid', 'overdue'],
  overdue: ['paid'],
  paid: [],
};

function isTransitionAllowed(from, to) {
  if (from === to) return true; // no-op, always ok
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

describe('Invoice status transitions', () => {
  describe('allowed transitions', () => {
    const cases = [
      ['draft', 'sent'],
      ['sent', 'paid'],
      ['sent', 'overdue'],
      ['overdue', 'paid'],
    ];

    it.each(cases)('%s → %s is allowed', (from, to) => {
      expect(isTransitionAllowed(from, to)).toBe(true);
    });
  });

  describe('blocked transitions', () => {
    const cases = [
      ['draft', 'paid'],
      ['draft', 'overdue'],
      ['sent', 'draft'],
      ['paid', 'draft'],
      ['paid', 'sent'],
      ['paid', 'overdue'],
      ['overdue', 'draft'],
      ['overdue', 'sent'],
    ];

    it.each(cases)('%s → %s is blocked', (from, to) => {
      expect(isTransitionAllowed(from, to)).toBe(false);
    });
  });

  describe('no-op transitions (same status)', () => {
    const statuses = ['draft', 'sent', 'paid', 'overdue'];

    it.each(statuses)('%s → %s is a no-op (allowed)', (status) => {
      expect(isTransitionAllowed(status, status)).toBe(true);
    });
  });
});
