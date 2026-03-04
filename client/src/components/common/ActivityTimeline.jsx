/**
 * ActivityTimeline — shows the audit log for a single invoice.
 *
 * Each log entry is rendered as a vertical timeline with an icon + description.
 * The component fetches its own data so InvoiceDetail.jsx stays clean.
 */
import { useState, useEffect } from 'react';
import { invoiceService } from '../../services/invoiceService';
import {
  Plus,
  Pencil,
  ArrowRight,
  Mail,
  Trash2,
  Activity,
} from 'lucide-react';

const ACTION_CONFIG = {
  created: {
    icon: Plus,
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    label: (d) => `Invoice ${d?.invoiceNumber || ''} created`,
  },
  updated: {
    icon: Pencil,
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    label: (d) =>
      d?.updatedFields?.length
        ? `Updated: ${d.updatedFields.join(', ')}`
        : 'Invoice details updated',
  },
  status_changed: {
    icon: ArrowRight,
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    label: (d) =>
      d?.from && d?.to
        ? `Status changed: ${d.from} → ${d.to}`
        : 'Status updated',
  },
  email_sent: {
    icon: Mail,
    color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    label: (d) => (d?.to ? `Email sent to ${d.to}` : 'Invoice emailed to client'),
  },
  deleted: {
    icon: Trash2,
    color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    label: () => 'Invoice deleted',
  },
};

const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ActivityTimeline = ({ invoiceId }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await invoiceService.getActivity(invoiceId);
        setActivity(data.activity || []);
      } catch {
        // Silently fail — timeline is supplementary info
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Activity</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No activity recorded yet
        </p>
      ) : (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-3.5 top-6 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
          <div className="space-y-4">
            {activity.map((entry) => {
              const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;
              const Icon = cfg.icon;
              return (
                <div key={entry._id} className="flex items-start gap-3 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {cfg.label(entry.details)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
