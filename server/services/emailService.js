/**
 * @module services/emailService
 * @description Dual-mode email service: sends via SMTP when credentials are
 * configured, otherwise falls back to a console-preview mode so development
 * and demo environments work without a real mail server.
 */
import nodemailer from 'nodemailer';
import config from '../config/index.js';

// ────────────────────────────────────────────────
// Lazy-initialised SMTP transporter.
// Falls back to a "preview-only" mode when SMTP
// credentials are not configured — the email HTML
// is logged to the console so developers can still
// see what would have been sent.
// ────────────────────────────────────────────────

let transporter = null;

/**
 * Returns true if SMTP credentials are configured.
 */
export const isEmailConfigured = () =>
  Boolean(config.smtp.user && config.smtp.pass);

/**
 * Initialise (or return cached) nodemailer transporter.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for others
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

/**
 * Send an email.
 * @param {Object}  opts
 * @param {string}  opts.to       - Recipient email
 * @param {string}  opts.subject  - Subject line
 * @param {string}  opts.html     - HTML body
 * @param {string} [opts.text]    - Plain-text fallback
 * @returns {Promise<{success: boolean, messageId?: string, preview?: boolean}>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  // If SMTP is not configured, log to console for development
  if (!isEmailConfigured()) {
    console.log('\n📧 EMAIL PREVIEW (SMTP not configured)');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${(text || html).substring(0, 200)}…\n`);
    return { success: true, preview: true };
  }

  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // strip tags as fallback
  });

  return { success: true, messageId: info.messageId };
};

// ────────────────────────────────────────────────
// Pre-built email templates
// ────────────────────────────────────────────────

/**
 * Build a styled invoice email (send / share).
 */
export const buildInvoiceEmail = (invoice, senderName) => {
  const fmtCurrency = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const itemsRows = invoice.items
    .map(
      (item, i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.description}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtCurrency(item.rate)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${fmtCurrency(item.amount)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Invoice ${invoice.invoiceNumber}</h1>
        <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">from ${senderName}</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none">
        <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Bill To</p>
        <p style="margin:0 0 16px;font-weight:600">${invoice.clientName}</p>
        <table style="width:100%;font-size:13px;color:#6b7280;margin-bottom:16px">
          <tr>
            <td>Issue Date: <strong style="color:#1f2937">${fmtDate(invoice.issueDate)}</strong></td>
            <td style="text-align:right">Due Date: <strong style="color:#1f2937">${fmtDate(invoice.dueDate)}</strong></td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left;font-weight:600">#</th>
              <th style="padding:8px;text-align:left;font-weight:600">Description</th>
              <th style="padding:8px;text-align:right;font-weight:600">Qty</th>
              <th style="padding:8px;text-align:right;font-weight:600">Rate</th>
              <th style="padding:8px;text-align:right;font-weight:600">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="text-align:right;margin-top:16px;font-size:14px">
          <p style="margin:4px 0;color:#6b7280">Subtotal: ${fmtCurrency(invoice.subtotal)}</p>
          ${invoice.taxRate > 0 ? `<p style="margin:4px 0;color:#6b7280">Tax (${invoice.taxRate}%): ${fmtCurrency(invoice.taxAmount)}</p>` : ''}
          ${invoice.discount > 0 ? `<p style="margin:4px 0;color:#ef4444">Discount: -${fmtCurrency(invoice.discount)}</p>` : ''}
          <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#1f2937">Total: ${fmtCurrency(invoice.total)}</p>
        </div>
        ${invoice.notes ? `<div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
      </div>
      <div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        Sent via <strong>Invio</strong> — AI-Powered Invoice Management
      </div>
    </div>`;

  const subject = `Invoice ${invoice.invoiceNumber} from ${senderName}`;
  return { subject, html };
};

/**
 * Build a payment reminder email.
 */
export const buildReminderEmail = (invoice, reminderText, senderName) => {
  const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber}`;
  const html = `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">Payment Reminder</h1>
        <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px">${invoice.invoiceNumber}</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;font-size:14px;line-height:1.7;white-space:pre-wrap">${reminderText}</div>
      <div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        Sent via <strong>Invio</strong> — AI-Powered Invoice Management
      </div>
    </div>`;
  return { subject, html };
};
