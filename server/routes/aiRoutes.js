import express from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../validators/authValidator.js';
import {
  generateInvoiceSchema,
  paymentReminderSchema,
  sendReminderSchema,
} from '../validators/aiValidator.js';
import {
  aiGenerateInvoice,
  aiPaymentReminder,
  aiInsights,
  sendReminderEmail,
} from '../controllers/aiController.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-invoice  — text → structured invoice
router.post('/generate-invoice', validate(generateInvoiceSchema), aiGenerateInvoice);

// POST /api/ai/payment-reminder  — invoice → reminder email
router.post('/payment-reminder', validate(paymentReminderSchema), aiPaymentReminder);

// POST /api/ai/send-reminder     — send generated reminder via email
router.post('/send-reminder', validate(sendReminderSchema), sendReminderEmail);

// GET  /api/ai/insights           — analyse all invoices
router.get('/insights', aiInsights);

export default router;
