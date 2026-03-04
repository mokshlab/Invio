/**
 * PublicInvoice — a read-only invoice view accessible via a share token.
 *
 * Route: /invoice/:token  (no auth required)
 * Data:  GET /api/public/invoices/:token
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Shield, Printer, AlertTriangle, Loader } from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const PublicInvoice = () => {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/public/invoices/${token}`);
        setInvoice(data.invoice);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'This invoice link is invalid or has expired.'
            : 'Failed to load invoice. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invoice Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      {/* Shared-by banner */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-lg px-4 py-2.5 shadow-sm border border-gray-200 dark:border-gray-700">
          <Shield className="w-4 h-4 text-primary-500 shrink-0" />
          <span>
            This invoice was shared with you — <strong>view only</strong>. No login required.
          </span>
          <button
            onClick={() => window.print()}
            className="ml-auto flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div
        id="invoice-print"
        className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {invoice.businessName || 'Invoice'}
            </h1>
            {invoice.businessEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {invoice.businessEmail}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Invoice
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              #{invoice.invoiceNumber}
            </p>
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                STATUS_STYLES[invoice.status] || STATUS_STYLES.draft
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Date + client info grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Bill To
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {invoice.clientName}
            </p>
            {invoice.clientEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientEmail}</p>
            )}
            {invoice.clientAddress && (
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap mt-0.5">
                {invoice.clientAddress}
              </p>
            )}
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Issue Date
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{invoiceDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Due Date
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{dueDate}</p>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  Description
                </th>
                <th className="text-right py-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  Qty
                </th>
                <th className="text-right py-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  Rate
                </th>
                <th className="text-right py-2 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-gray-800 dark:text-gray-200">{item.description}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                    ${Number(item.rate).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-800 dark:text-gray-200">
                    ${Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(invoice.taxRate) > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>${Number(invoice.taxAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Discount</span>
                <span>−${Number(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span>Total</span>
              <span>${Number(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicInvoice;
