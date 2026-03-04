/**
 * auditService — fire-and-forget audit logger.
 *
 * Deliberately never throws: audit failures are non-critical and must not
 * interrupt the main request flow. We log the error for visibility but the
 * caller receives no exception.
 */
import AuditLog from '../models/AuditLog.js';

/**
 * Log an activity event on an invoice.
 * @param {ObjectId} userId  - The user performing the action
 * @param {ObjectId} invoiceId  - The affected invoice
 * @param {string}   action  - One of: created | updated | status_changed | email_sent | deleted
 * @param {object}   details - Optional context (e.g. { from: 'draft', to: 'sent' })
 */
export const logActivity = async (userId, invoiceId, action, details = {}) => {
  try {
    await AuditLog.create({ user: userId, invoice: invoiceId, action, details });
  } catch (err) {
    // Non-critical — log but never rethrow
    console.error('Audit log write failed (non-critical):', err.message);
  }
};
