/**
 * Public routes — no authentication required.
 *
 * Why an opaque shareToken instead of the MongoDB _id?
 * - The _id is guessable/enumerable; any logged-in user could probe others' invoices.
 * - A 32-char hex token (128 bits of randomness) is unguessable and
 *   can be revoked in the future by rotating the token.
 * - This is the same pattern used by Stripe, FreshBooks, and Wave for
 *   client-facing invoice views.
 */
import express from 'express';
import Invoice from '../models/Invoice.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// @desc  Get a public (read-only) view of an invoice via share token
// @route GET /api/public/invoices/:token
// @access Public — NO authentication required
router.get('/invoices/:token', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne(
      { shareToken: req.params.token },
      // Expose only the fields a client needs to see — never return user/internal fields
      'invoiceNumber clientName clientEmail clientPhone clientAddress issueDate dueDate items subtotal taxRate taxAmount discount total notes terms status'
    );

    if (!invoice) {
      throw new AppError('Invoice not found or link is invalid', 404);
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
});

export default router;
