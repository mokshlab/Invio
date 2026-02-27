import {
  generateInvoiceFromText,
  generatePaymentReminder,
  generateInsights,
} from '../services/geminiService.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { sendEmail, buildReminderEmail } from '../services/emailService.js';

// @desc    AI: Generate invoice from client text/email
// @route   POST /api/ai/generate-invoice
// @access  Private
export const aiGenerateInvoice = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      throw new AppError('Please provide at least 10 characters of text to analyse.', 400);
    }

    // Fetch sender's business info to enrich the prompt
    const user = await User.findById(req.user._id);
    const senderInfo = {
      businessName: user.businessName,
      businessEmail: user.businessEmail,
      businessPhone: user.businessPhone,
    };

    const result = await generateInvoiceFromText(text.trim(), senderInfo);

    res.json({
      message: 'Invoice data generated successfully',
      invoice: result,
    });
  } catch (error) {
    if (error.message?.includes('GEMINI_API_KEY')) {
      return next(new AppError(error.message, 503));
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return next(new AppError('AI rate limit reached. Please wait a moment and try again.', 429));
    }
    if (error instanceof SyntaxError) {
      return next(new AppError('AI returned an invalid response. Please try again.', 502));
    }
    next(error);
  }
};

// @desc    AI: Generate payment reminder email
// @route   POST /api/ai/payment-reminder
// @access  Private
export const aiPaymentReminder = async (req, res, next) => {
  try {
    const { invoiceId, tone = 'professional' } = req.body;

    if (!invoiceId) {
      throw new AppError('Invoice ID is required.', 400);
    }

    const validTones = ['friendly', 'professional', 'urgent'];
    if (!validTones.includes(tone)) {
      throw new AppError(`Tone must be one of: ${validTones.join(', ')}`, 400);
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      throw new AppError('Invoice not found.', 404);
    }

    if (invoice.status === 'paid') {
      throw new AppError('This invoice is already paid.', 400);
    }

    const result = await generatePaymentReminder(invoice, tone);

    res.json({
      message: 'Payment reminder generated successfully',
      reminder: result,
    });
  } catch (error) {
    if (error.message?.includes('GEMINI_API_KEY')) {
      return next(new AppError(error.message, 503));
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return next(new AppError('AI rate limit reached. Please wait a moment and try again.', 429));
    }
    if (error instanceof SyntaxError) {
      return next(new AppError('AI returned an invalid response. Please try again.', 502));
    }
    next(error);
  }
};

// @desc    AI: Generate business insights from invoice data
// @route   GET /api/ai/insights
// @access  Private
export const aiInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all user invoices
    const invoices = await Invoice.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (invoices.length < 2) {
      throw new AppError(
        'You need at least 2 invoices before AI can generate meaningful insights.',
        400
      );
    }

    // Aggregate stats
    const statusStats = await Invoice.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    const totalInvoices = statusStats.reduce((s, i) => s + i.count, 0);
    const totalRevenue = statusStats
      .filter((s) => s._id === 'paid')
      .reduce((s, i) => s + i.total, 0);
    const pendingAmount = statusStats
      .filter((s) => s._id === 'sent' || s._id === 'overdue')
      .reduce((s, i) => s + i.total, 0);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          user: userId,
          status: 'paid',
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const stats = {
      totalInvoices,
      totalRevenue,
      pendingAmount,
      statusBreakdown: statusStats,
      monthlyRevenue,
    };

    const result = await generateInsights(invoices, stats);

    res.json({
      message: 'Insights generated successfully',
      insights: result,
      meta: {
        invoicesAnalysed: invoices.length,
        totalRevenue,
        pendingAmount,
      },
    });
  } catch (error) {
    if (error.message?.includes('GEMINI_API_KEY')) {
      return next(new AppError(error.message, 503));
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return next(new AppError('AI rate limit reached. Please wait a moment and try again.', 429));
    }
    if (error instanceof SyntaxError) {
      return next(new AppError('AI returned an invalid response. Please try again.', 502));
    }
    next(error);
  }
};

// @desc    Send AI-generated payment reminder via email
// @route   POST /api/ai/send-reminder
// @access  Private
export const sendReminderEmail = async (req, res, next) => {
  try {
    const { invoiceId, reminderText } = req.body;

    if (!invoiceId || !reminderText) {
      throw new AppError('Invoice ID and reminder text are required.', 400);
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) throw new AppError('Invoice not found.', 404);
    if (!invoice.clientEmail) {
      throw new AppError('Client email is required to send a reminder.', 400);
    }

    const senderName = req.user.businessName || req.user.name;
    const { subject, html } = buildReminderEmail(invoice, reminderText, senderName);

    const result = await sendEmail({ to: invoice.clientEmail, subject, html });

    res.json({
      message: result.preview
        ? 'Reminder previewed (SMTP not configured)'
        : `Reminder sent to ${invoice.clientEmail}`,
      preview: result.preview || false,
    });
  } catch (error) {
    next(error);
  }
};