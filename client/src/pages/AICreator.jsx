import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { invoiceService } from '../services/invoiceService';
import { formatCurrency as fmt } from '../utils/format';
import {
  Sparkles,
  FileText,
  Mail,
  BarChart3,
  Send,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Star,
  Lightbulb,
  RefreshCw,
  User,
  Phone,
  MapPin,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'generate', label: 'Invoice Generator', icon: FileText },
  { id: 'reminder', label: 'Payment Reminders', icon: Mail },
  { id: 'insights', label: 'AI Insights', icon: BarChart3 },
];

const TONES = [
  { value: 'friendly', label: 'Friendly', emoji: '😊', desc: 'Warm & non-confrontational' },
  { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Formal & courteous' },
  { value: 'urgent', label: 'Urgent', emoji: '⚠️', desc: 'Assertive & firm' },
];

const SAMPLE_TEXTS = [
  `Hi, I need a website redesign for my bakery shop "Sweet Crust". My name is Sarah Mitchell, email sarah@sweetcrust.com. I need a new homepage, about page, menu page, and contact form. Also need SEO optimization and mobile responsive design.`,
  `Hello, this is James from TechVibe LLC (james@techvibe.io). We discussed building a REST API with authentication, database design, and admin dashboard. We also need API documentation and deployment to AWS. Budget around $3000-5000.`,
  `Need a logo design, business card design, and brand guidelines document for my startup "GreenLeaf Analytics". Contact: alex@greenleaf.co, phone 555-0199. Also need social media templates for Instagram and LinkedIn.`,
];

// ─── Main Component ───
const AICreator = () => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary-600" />
          AI Creator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Powered by Google Gemini — generate invoices, reminders, and insights instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'generate' && <InvoiceGeneratorTab />}
              {activeTab === 'reminder' && <PaymentReminderTab />}
              {activeTab === 'insights' && <InsightsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Invoice Preview Skeleton (loading state) ───
const InvoicePreviewSkeleton = () => (
  <div className="animate-pulse space-y-0">
    {/* Header bar */}
    <div className="bg-gray-200 dark:bg-gray-700 rounded-t-xl h-16" />
    <div className="bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-xl p-6 space-y-5">
      {/* AI summary */}
      <div className="h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg" />
      {/* Client info grid */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      {/* Items table skeleton */}
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="h-3 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 bg-gray-100 dark:bg-gray-700/60 rounded" />
            <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700/60 rounded" />
            <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700/60 rounded" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700/60 rounded" />
          </div>
        ))}
      </div>
      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-48 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="flex justify-between border-t pt-2">
            <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// TAB 1 — Invoice Generator
// ═══════════════════════════════════════════════════
const InvoiceGeneratorTab = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (text.trim().length < 10) {
      toast.error('Please enter at least 10 characters');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiService.generateInvoice(text.trim());
      setResult(data.invoice);
      toast.success('Invoice data generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = (sample) => {
    setText(sample);
  };

  const handleCreateInvoice = async () => {
    if (!result) return;
    try {
      const payload = {
        clientName: result.clientName || '',
        clientEmail: result.clientEmail || '',
        clientPhone: result.clientPhone || '',
        clientAddress: result.clientAddress || '',
        items: (result.items || []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          rate: i.rate,
        })),
        taxRate: result.taxRate || 0,
        discount: result.discount || 0,
        notes: result.notes || '',
        terms: result.terms || '',
        status: 'draft',
      };
      const { data } = await invoiceService.create(payload);
      toast.success('Invoice created from AI data!');
      navigate(`/invoices/${data.invoice._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  // Compute totals for display
  const subtotal = result
    ? (result.items || []).reduce((s, i) => s + i.quantity * i.rate, 0)
    : 0;
  const tax = subtotal * ((result?.taxRate || 0) / 100);
  const total = subtotal + tax - (result?.discount || 0);

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Describe your invoice or paste a client message
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="e.g. 'Hi, I need a website redesign for my bakery. My name is Sarah, email sarah@bakery.com. I need homepage, menu page, and contact form...'"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{text.length} characters (min 10)</p>
      </div>

      {/* Sample prompts */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Try a sample:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEXTS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleUseSample(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || text.trim().length < 10}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Invoice Data
          </>
        )}
      </button>

      {/* Loading skeleton */}
      {loading && <InvoicePreviewSkeleton />}

      {/* Styled invoice preview card */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header bar — looks like a real invoice */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-white/80" />
              <span className="text-white font-semibold text-lg">Invoice Preview</span>
            </div>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
              AI Generated
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 space-y-5">
            {/* AI summary banner */}
            {result.summary && (
              <div className="flex items-start gap-2 text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg px-4 py-2.5">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{result.summary}</span>
              </div>
            )}

            {/* Client details — styled card */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Bill To
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Client</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.clientName || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.clientEmail || '—'}</p>
                  </div>
                </div>
                {result.clientPhone && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.clientPhone}</p>
                    </div>
                  </div>
                )}
                {result.clientAddress && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.clientAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Line items — styled table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Line Items
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> Description
                        </div>
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(result.items || []).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{fmt(item.rate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {fmt(item.quantity * item.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals — right-aligned summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(subtotal)}</span>
                </div>
                {(result.taxRate || 0) > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Tax ({result.taxRate}%)</span>
                    <span>{fmt(tax)}</span>
                  </div>
                )}
                {(result.discount || 0) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-{fmt(result.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t-2 border-primary-200 dark:border-primary-800 pt-2">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {result.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Note</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{result.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleCreateInvoice}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Create Invoice
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setText('');
                }}
                className="btn-secondary flex items-center gap-2"
              >
                Start Over
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Send Reminder Email — small helper button
// ═══════════════════════════════════════════════════
const SendReminderButton = ({ invoiceId, reminderBody }) => {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const { data } = await aiService.sendReminder(invoiceId, reminderBody);
      toast.success(data.message || 'Reminder email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {sending ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      {sending ? 'Sending...' : 'Send via Email'}
    </button>
  );
};

// ═══════════════════════════════════════════════════
// TAB 2 — Payment Reminders
// ═══════════════════════════════════════════════════
const PaymentReminderTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [reminder, setReminder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await invoiceService.getAll({ status: 'sent,overdue' });
        setInvoices(data.invoices || []);
      } catch {
        toast.error('Failed to load invoices');
      } finally {
        setLoadingInvoices(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!selectedId) {
      toast.error('Please select an invoice');
      return;
    }
    setLoading(true);
    setReminder(null);
    try {
      const { data } = await aiService.generateReminder(selectedId, tone);
      setReminder(data.reminder);
      toast.success('Reminder generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate reminder');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loadingInvoices) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No unpaid invoices found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Create and send an invoice first, then come back to generate a reminder.
          </p>
        </div>
      ) : (
        <>
          {/* Invoice select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select an unpaid invoice
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">Choose invoice...</option>
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} — {inv.clientName} — {fmt(inv.total)} ({inv.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tone select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reminder tone
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    tone === t.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">{t.emoji}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedId}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating reminder...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Generate Reminder
              </>
            )}
          </button>
        </>
      )}

      {/* Reminder result */}
      {reminder && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4"
        >
          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Subject
              </span>
              <button
                onClick={() => copyToClipboard(reminder.subject, 'subject')}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {copiedField === 'subject' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reminder.subject}</p>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Email Body
              </span>
              <button
                onClick={() => copyToClipboard(reminder.body, 'body')}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {copiedField === 'body' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {reminder.body}
            </div>
          </div>

          {/* Overdue info + tips */}
          <div className="flex flex-col sm:flex-row gap-3">
            {reminder.overdueDays > 0 && (
              <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                {reminder.overdueDays} days overdue
              </div>
            )}
            {reminder.tips && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-2 rounded-lg flex-1">
                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                {reminder.tips}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                copyToClipboard(`Subject: ${reminder.subject}\n\n${reminder.body}`, 'full')
              }
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              {copiedField === 'full' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copiedField === 'full' ? 'Copied!' : 'Copy Full Email'}
            </button>
            <SendReminderButton invoiceId={selectedId} reminderBody={reminder.body} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// TAB 3 — AI Insights
// ═══════════════════════════════════════════════════
const InsightsTab = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [meta, setMeta] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const { data } = await aiService.getInsights();
      setInsights(data.insights);
      setMeta(data.meta);
      toast.success('Insights generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = ({ direction }) => {
    if (direction === 'up') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (direction === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
  };

  const priorityColor = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Let AI analyse your invoice history and provide actionable business insights.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analysing your data...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              {insights ? 'Refresh Insights' : 'Generate Insights'}
            </>
          )}
        </button>
      </div>

      {/* Insights cards */}
      {insights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Meta stats */}
          {meta && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary-700">
                  {meta.invoicesAnalysed}
                </div>
                <div className="text-xs text-primary-600">Invoices Analysed</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {fmt(meta.totalRevenue)}
                </div>
                <div className="text-xs text-emerald-600">Total Revenue</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {fmt(meta.pendingAmount)}
                </div>
                <div className="text-xs text-amber-600">Pending</div>
              </div>
            </div>
          )}

          {/* Revenue Trend */}
          {insights.revenueTrend && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <TrendIcon direction={insights.revenueTrend.direction} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Revenue Trend</h3>
                  {insights.revenueTrend.percentage && (
                    <span
                      className={`text-sm font-medium ${
                        insights.revenueTrend.direction === 'up'
                          ? 'text-emerald-600'
                          : insights.revenueTrend.direction === 'down'
                          ? 'text-red-600'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {insights.revenueTrend.percentage}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {insights.revenueTrend.summary}
              </p>
            </div>
          )}

          {/* Payment Health */}
          {insights.paymentHealth && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payment Health</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Score:</span>
                  <span
                    className={`text-lg font-bold ${
                      insights.paymentHealth.score >= 7
                        ? 'text-emerald-600'
                        : insights.paymentHealth.score >= 4
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {insights.paymentHealth.score}/10
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                {insights.paymentHealth.summary}
              </p>
              {insights.paymentHealth.riskClients?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insights.paymentHealth.riskClients.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client Patterns */}
          {insights.clientPatterns?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Client Patterns</h3>
              <div className="space-y-3">
                {insights.clientPatterns.map((p, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">{p.insight}</p>
                      <p className="text-primary-600 font-medium mt-0.5">{p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recommendations</h3>
              <div className="space-y-3">
                {insights.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <Star className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{r.title}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            priorityColor[r.priority] || priorityColor.medium
                          }`}
                        >
                          {r.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{r.description}</p>
                      {r.impact && (
                        <p className="text-xs text-emerald-600 mt-1">Impact: {r.impact}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fun Fact */}
          {insights.funFact && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                  Fun Fact
                </p>
                <p className="text-sm text-primary-800">{insights.funFact}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AICreator;
