import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
} from '../controllers/invoiceController.js';
import { validateCreateInvoice, validateUpdateInvoice } from '../validators/invoiceValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All invoice routes require authentication
router.use(protect);

// Stats must come BEFORE /:id to avoid "stats" being treated as an id
router.get('/stats', getInvoiceStats);

router.route('/')
  .get(getInvoices)
  .post(validateCreateInvoice, createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(validateUpdateInvoice, updateInvoice)
  .delete(deleteInvoice);

export default router;
