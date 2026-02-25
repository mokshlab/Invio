import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  aiGenerateInvoice,
  aiPaymentReminder,
  aiInsights,
} from '../controllers/aiController.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-invoice  — text → structured invoice
router.post('/generate-invoice', aiGenerateInvoice);

// POST /api/ai/payment-reminder  — invoice → reminder email
router.post('/payment-reminder', aiPaymentReminder);

// GET  /api/ai/insights           — analyse all invoices
router.get('/insights', aiInsights);

export default router;
