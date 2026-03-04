import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  sendInvoiceEmail,
  getEmailStatus,
  bulkDeleteInvoices,
  getInvoiceActivity,
} from '../controllers/invoiceController.js';
import { validateCreateInvoice, validateUpdateInvoice } from '../validators/invoiceValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All invoice routes require authentication
router.use(protect);

// Stats & email status must come BEFORE /:id to avoid param capture
router.get('/stats', getInvoiceStats);
router.get('/email-status', getEmailStatus);
router.post('/bulk-delete', bulkDeleteInvoices);

router.route('/')
  .get(getInvoices)
  .post(validateCreateInvoice, createInvoice);

router.post('/:id/send', sendInvoiceEmail);
router.get('/:id/activity', getInvoiceActivity);

router.route('/:id')
  .get(getInvoiceById)
  .put(validateUpdateInvoice, updateInvoice)
  .delete(deleteInvoice);

export default router;
