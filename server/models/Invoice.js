import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
      index: true,
    },

    // ---- Client details (embedded, not a separate collection) ----
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    clientPhone: {
      type: String,
      trim: true,
      default: '',
    },
    clientAddress: {
      type: String,
      trim: true,
      default: '',
    },

    // ---- Invoice details ----
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Invoice must have at least one item',
      },
    },

    // ---- Financial summary ----
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },

    // ---- Extra ----
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    terms: {
      type: String,
      trim: true,
      default: 'Payment is due within the specified due date.',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user's invoices filtered by status
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, createdAt: -1 });

/**
 * Pre-validate hook: calculate financial fields from items.
 * Runs before validation so computed fields are set in time.
 */
invoiceSchema.pre('validate', function (next) {
  // Always recalculate from items
  this.subtotal = this.items.reduce((sum, item) => {
    item.amount = item.quantity * item.rate;
    return sum + item.amount;
  }, 0);

  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  this.total = this.subtotal + this.taxAmount - this.discount;

  // Prevent negative totals
  if (this.total < 0) this.total = 0;

  next();
});

/**
 * Static method: generate next invoice number for a user.
 * Format: INV-YYYY-NNNN (e.g., INV-2026-0001)
 */
invoiceSchema.statics.generateInvoiceNumber = async function (userId) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await this.findOne(
    { user: userId, invoiceNumber: { $regex: `^${prefix}` } },
    { invoiceNumber: 1 }
  ).sort({ invoiceNumber: -1 });

  if (!lastInvoice) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
  const nextNumber = String(lastNumber + 1).padStart(4, '0');
  return `${prefix}${nextNumber}`;
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
