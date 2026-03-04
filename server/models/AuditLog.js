/**
 * AuditLog model — append-only record of every meaningful action on an invoice.
 *
 * Why: Real production apps need an audit trail. Without it you have no idea
 * who changed what or when. This also provides a natural activity feed for the
 * invoice detail UI, so users can see the full lifecycle of each invoice.
 *
 * Design decisions:
 * - Append-only: we never update or delete audit logs.
 * - Stored separately from Invoice to keep the invoice document lean.
 * - `details` is Mixed so we can store arbitrary context per action type
 *   (e.g. previous status, recipient email) without schema gymnastics.
 */
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'email_sent', 'deleted'],
      required: true,
    },
    // Flexible payload — e.g. { from: 'draft', to: 'sent' } for status_changed
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Fast retrieval: get all logs for an invoice sorted newest-first
auditLogSchema.index({ invoice: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
