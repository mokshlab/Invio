/**
 * Cron service — scheduled background jobs.
 *
 * Why: Real invoice apps can't rely on a user visiting the page to detect
 * overdue invoices. A daily job that runs regardless of traffic is the correct
 * production pattern. The job is idempotent — running it twice has no adverse
 * effect because `updateMany` on already-overdue invoices is a no-op.
 *
 * Schedule: 00:05 daily (5 min after midnight so it doesn't race with
 * any end-of-day batch processes hitting at exactly 00:00).
 */
import cron from 'node-cron';
import Invoice from '../models/Invoice.js';

export const startCronJobs = () => {
  // ── Overdue detection: runs daily at 00:05 ──
  cron.schedule('5 0 * * *', async () => {
    try {
      const now = new Date();

      // Find every sent invoice whose due date has passed and mark it overdue.
      // Only touches 'sent' → prevents accidentally rolling back a 'paid' invoice.
      const result = await Invoice.updateMany(
        { status: 'sent', dueDate: { $lt: now } },
        { $set: { status: 'overdue' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`⏰ Cron [overdue]: marked ${result.modifiedCount} invoice(s) as overdue`);
      }
    } catch (err) {
      console.error('❌ Cron [overdue] failed:', err.message);
    }
  });

  console.log('⏰ Cron jobs registered — overdue detection runs daily at 00:05');
};
