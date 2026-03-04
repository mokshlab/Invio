import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { formatCurrency } from '../utils/format';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SuccessAnimation from '../components/common/SuccessAnimation';

const emptyItem = { description: '', quantity: 1, rate: 0, amount: 0 };

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const formDirty = useRef(false);

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ ...emptyItem }],
    taxRate: 0,
    discount: 0,
    notes: '',
    terms: 'Payment is due within the specified due date.',
    status: 'draft',
  });

  // Fetch invoice data if editing
  useEffect(() => {
    if (isEditing) {
      (async () => {
        try {
          const { data } = await invoiceService.getById(id);
          const inv = data.invoice;
          setForm({
            clientName: inv.clientName,
            clientEmail: inv.clientEmail || '',
            clientPhone: inv.clientPhone || '',
            clientAddress: inv.clientAddress || '',
            issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
            dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
            items: inv.items.length > 0 ? inv.items : [{ ...emptyItem }],
            taxRate: inv.taxRate || 0,
            discount: inv.discount || 0,
            notes: inv.notes || '',
            terms: inv.terms || '',
            status: inv.status,
          });
        } catch {
          toast.error('Invoice not found');
          navigate('/invoices');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, isEditing, navigate]);

  // Set default due date to 30 days from issue date
  useEffect(() => {
    if (!isEditing && !form.dueDate && form.issueDate) {
      const due = new Date(form.issueDate);
      due.setDate(due.getDate() + 30);
      setForm((prev) => ({ ...prev, dueDate: due.toISOString().split('T')[0] }));
    }
  }, [form.issueDate, form.dueDate, isEditing]);

  // Unsaved changes warning
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (formDirty.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // ---- Handlers ----

  const handleChange = (e) => {
    const { name, value } = e.target;
    formDirty.current = true;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleItemChange = (index, field, value) => {
    formDirty.current = true;
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Recalculate line amount
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(items[index].quantity) || 0;
        const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(items[index].rate) || 0;
        items[index].amount = qty * rate;
      }

      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ---- Calculations ----
  const subtotal = form.items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
    0
  );
  const taxAmount = (subtotal * (parseFloat(form.taxRate) || 0)) / 100;
  const total = subtotal + taxAmount - (parseFloat(form.discount) || 0);

  // ---- Validation ----
  const validate = () => {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'Client name is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    if (form.items.some((item) => !item.description.trim())) {
      errs.items = 'All items need a description';
    }
    if (form.items.some((item) => parseFloat(item.quantity) <= 0)) {
      errs.items = 'Quantity must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Submit ----
  const handleSubmit = async (status) => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        status: status || form.status,
        items: form.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
        taxRate: parseFloat(form.taxRate) || 0,
        discount: parseFloat(form.discount) || 0,
      };

      if (isEditing) {
        await invoiceService.update(id, payload);
        setSuccessMsg('Invoice Updated!');
      } else {
        await invoiceService.create(payload);
        setSuccessMsg('Invoice Created!');
      }
      formDirty.current = false;
      setShowSuccess(true);
      setTimeout(() => navigate('/invoices'), 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {isEditing ? 'Update invoice details' : 'Fill in the details to create an invoice'}
          </p>
        </div>
      </div>

      {/* Client Details */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">1</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Client Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              className={`input-field ${errors.clientName ? 'border-red-300' : ''}`}
              placeholder="Company / Client name"
            />
            {errors.clientName && (
              <p className="text-sm text-red-500 mt-1">{errors.clientName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Email
            </label>
            <input
              type="email"
              name="clientEmail"
              value={form.clientEmail}
              onChange={handleChange}
              className="input-field"
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              name="clientPhone"
              value={form.clientPhone}
              onChange={handleChange}
              className="input-field"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              name="clientAddress"
              value={form.clientAddress}
              onChange={handleChange}
              className="input-field"
              placeholder="123 Main St, City, State"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">2</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoice Dates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issue Date
            </label>
            <input
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className={`input-field ${errors.dueDate ? 'border-red-300' : ''}`}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">3</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Items</h2>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {errors.items && (
          <p className="text-sm text-red-500 mb-3">{errors.items}</p>
        )}

        {/* Table header (desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-3 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          <div className="col-span-5">Description</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-3">
          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Item description"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Qty"
                  min="0.01"
                  step="any"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm pointer-events-none">$</span>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="input-field text-sm pl-7"
                    placeholder="Rate"
                    min="0"
                    step="any"
                  />
                </div>
              </div>
              <div className="col-span-3 md:col-span-2 flex items-center justify-end h-[42px]">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(
                    (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
                  )}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-center h-[42px]">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={form.items.length <= 1}
                  aria-label="Remove line item"
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Notes & Terms */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">4</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes & Terms</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Additional notes for the client..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Terms
              </label>
              <textarea
                name="terms"
                value={form.terms}
                onChange={handleChange}
                rows={2}
                className="input-field resize-none"
                placeholder="Payment terms..."
              />
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="card bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">5</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Tax</span>
                <input
                  type="number"
                  name="taxRate"
                  value={form.taxRate}
                  onChange={handleChange}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-sm text-center"
                  min="0"
                  max="100"
                />
                <span className="text-gray-500 dark:text-gray-400">%</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(taxAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="text-gray-400 dark:text-gray-500">$</span>
                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-sm"
                  min="0"
                />
              </div>
              <span className="font-medium text-red-500">
                -{formatCurrency(parseFloat(form.discount) || 0)}
              </span>
            </div>

            <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                {formatCurrency(total > 0 ? total : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end mb-8">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="btn-secondary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('sent')}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? 'Update & Send' : 'Create & Send'}
            </>
          )}
        </button>
      </div>

      <SuccessAnimation show={showSuccess} message={successMsg} />
    </div>
  );
};

export default InvoiceForm;
