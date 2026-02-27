import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  Download,
  Mail,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { downloadInvoicePDF } from '../utils/pdfExport';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Mail },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await invoiceService.getById(id);
        setInvoice(data.invoice);
      } catch {
        toast.error('Invoice not found');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await invoiceService.update(id, { status: newStatus });
      setInvoice(data.invoice);
      toast.success(`Invoice marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await invoiceService.delete(id);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) return <LoadingSpinner />;
  if (!invoice) return null;

  const statusCfg = STATUS_CONFIG[invoice.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Created on {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/invoices/${id}/edit`)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={async () => {
              try {
                await downloadInvoicePDF('invoice-print', invoice.invoiceNumber || 'invoice');
                toast.success('PDF downloaded!');
              } catch {
                toast.error('Failed to generate PDF');
              }
            }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {invoice.clientEmail && (
            <button
              onClick={async () => {
                setSending(true);
                try {
                  const { data } = await invoiceService.sendEmail(id);
                  toast.success(data.message);
                  if (data.invoice) setInvoice(data.invoice);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to send email');
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Email'}</span>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="card mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger text-sm py-1.5 px-3"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status actions */}
      {invoice.status !== 'paid' && (
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Change status:</span>
            {invoice.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('sent')}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
              >
                Mark as Sent
              </button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <button
                onClick={() => handleStatusChange('paid')}
                className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors"
              >
                Mark as Paid
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => handleStatusChange('overdue')}
                className="text-sm px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors"
              >
                Mark as Overdue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invoice preview (printable area) */}
      <div className="card print:shadow-none print:border-none" id="invoice-print">
        {/* Top section */}
        <div className="flex flex-col sm:flex-row justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">INVOICE</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Issue Date: <span className="text-gray-900 dark:text-gray-100">{formatDate(invoice.issueDate)}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Due Date: <span className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(invoice.dueDate)}</span>
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Bill To
          </p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.clientName}</p>
          {invoice.clientEmail && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientEmail}</p>
          )}
          {invoice.clientPhone && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientPhone}</p>
          )}
          {invoice.clientAddress && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientAddress}</p>
          )}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 font-medium text-gray-500 dark:text-gray-400">#</th>
                <th className="text-left py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                <th className="text-right py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                <th className="text-right py-3 font-medium text-gray-500 dark:text-gray-400">Rate</th>
                <th className="text-right py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="py-3 text-gray-900 dark:text-gray-100">{item.description}</td>
                  <td className="py-3 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tax ({invoice.taxRate}%)</span>
                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="text-red-500">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-900 dark:border-gray-100 pt-2">
              <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {invoice.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Terms & Conditions
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
