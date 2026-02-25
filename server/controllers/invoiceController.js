import Invoice from '../models/Invoice.js';
import AppError from '../utils/AppError.js';

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    const invoice = await Invoice.create({
      ...req.body,
      user: req.user._id,
      invoiceNumber,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
      ...(req.body.dueDate ? { dueDate: new Date(req.body.dueDate) } : {}),
    });

    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices for the logged-in user
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
  try {
    const { status, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    if (status && status !== 'all') {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(limitNum),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Update allowed fields
    const allowedFields = [
      'clientName', 'clientEmail', 'clientPhone', 'clientAddress',
      'issueDate', 'dueDate', 'items', 'taxRate', 'discount',
      'notes', 'terms', 'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'issueDate' || field === 'dueDate') {
          invoice[field] = new Date(req.body[field]);
        } else {
          invoice[field] = req.body[field];
        }
      }
    });

    await invoice.save(); // triggers pre-save recalculation

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice stats for dashboard
// @route   GET /api/invoices/stats
// @access  Private
export const getInvoiceStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [statusStats, monthlyRevenue, recentInvoices] = await Promise.all([
      // Aggregate by status
      Invoice.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),

      // Monthly revenue for last 6 months
      Invoice.aggregate([
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
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // 5 most recent invoices
      Invoice.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('invoiceNumber clientName total status createdAt dueDate'),
    ]);

    // Calculate totals from status stats
    const totalInvoices = statusStats.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = statusStats
      .filter((s) => s._id === 'paid')
      .reduce((sum, s) => sum + s.total, 0);
    const pendingAmount = statusStats
      .filter((s) => s._id === 'sent' || s._id === 'overdue')
      .reduce((sum, s) => sum + s.total, 0);

    res.json({
      stats: {
        totalInvoices,
        totalRevenue,
        pendingAmount,
        statusBreakdown: statusStats,
        monthlyRevenue,
      },
      recentInvoices,
    });
  } catch (error) {
    next(error);
  }
};
