import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { formatCurrency, formatDateShort as formatDate } from '../utils/format';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_ICONS = {
  draft: Clock,
  sent: Send,
  paid: CheckCircle,
  overdue: AlertCircle,
};

// ─── Sortable column config ───
const SORTABLE_COLS = [
  { key: 'invoiceNumber', label: 'Invoice' },
  { key: 'clientName',    label: 'Client'  },
  { key: 'createdAt',     label: 'Date'    },
  { key: 'total',         label: 'Amount'  },
  { key: 'status',        label: 'Status'  },
];

// ─── Hover Preview Card ───
const HoverPreview = ({ invoice, position }) => {
  if (!invoice || !position) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 pointer-events-none"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {invoice.invoiceNumber}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[invoice.status]}`}
        >
          {(() => { const Icon = STATUS_ICONS[invoice.status]; return Icon ? <Icon className="w-3 h-3" /> : null; })()}
          {invoice.status}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Client</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate ml-2 max-w-[140px]">
            {invoice.clientName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Items</span>
          <span className="text-gray-700 dark:text-gray-300">{invoice.items?.length || 0} line items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Created</span>
          <span className="text-gray-700 dark:text-gray-300">{formatDate(invoice.createdAt)}</span>
        </div>
        {invoice.dueDate && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Due</span>
            <span className="text-gray-700 dark:text-gray-300">{formatDate(invoice.dueDate)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">Total</span>
          <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Invoices = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);
  const deleteTimerRef = useRef(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Hover preview state
  const [hoveredInvoice, setHoveredInvoice] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null);
  const hoverTimeoutRef = useRef(null);

  // Mobile swipe state
  const [swipedId, setSwipedId] = useState(null);

  const activeStatus = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSort = searchParams.get('sort') || '-createdAt';

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 10, sort: currentSort };
      if (activeStatus !== 'all') params.status = activeStatus;
      if (searchQuery) params.search = searchQuery;

      const { data } = await invoiceService.getAll(params);
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, searchQuery, currentPage, currentSort]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Clear selection when filters/page/sort change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeStatus, searchQuery, currentPage, currentSort]);

  const handleSort = (field) => {
    const params = new URLSearchParams(searchParams);
    // Toggle direction: if already sorting this field desc → asc, else → desc
    if (currentSort === `-${field}`) params.set('sort', field);
    else params.set('sort', `-${field}`);
    params.delete('page');
    setSearchParams(params);
  };

  // Returns the icon to show for a column header
  const SortIcon = ({ field }) => {
    if (currentSort === `-${field}`) return <ChevronDown className="w-3.5 h-3.5" />;
    if (currentSort === field)       return <ChevronUp   className="w-3.5 h-3.5" />;
    return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />;
  };

  const handleStatusFilter = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Debounce URL param update by 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set('search', value);
      else params.delete('search');
      params.delete('page');
      setSearchParams(params);
    }, 400);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (deleteId === id) {
      try {
        await invoiceService.delete(id);
        toast.success('Invoice deleted');
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        fetchInvoices();
      } catch {
        toast.error('Failed to delete invoice');
      }
      setDeleteId(null);
    } else {
      setDeleteId(id);
      // Auto-reset after 3 seconds
      deleteTimerRef.current = setTimeout(() => setDeleteId(null), 3000);
    }
  };

  // ─── Bulk selection helpers ───
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((inv) => inv._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await invoiceService.bulkDelete([...selectedIds]);
      toast.success(`${selectedIds.size} invoice${selectedIds.size > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      fetchInvoices();
    } catch {
      toast.error('Failed to delete invoices');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ─── Hover preview helpers ───
  const handleRowMouseEnter = (inv, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredInvoice(inv);
      setHoverPosition({
        top: rect.top - 8,
        left: rect.right + 12,
      });
    }, 400);
  };

  const handleRowMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredInvoice(null);
    setHoverPosition(null);
  };

  // ─── Mobile swipe helpers ───
  const touchStartRef = useRef(null);

  const handleTouchStart = (id, e) => {
    touchStartRef.current = { x: e.touches[0].clientX, id };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (deltaX < -60) {
      // Swiped left — reveal actions
      setSwipedId(touchStartRef.current.id);
    } else if (deltaX > 60) {
      // Swiped right — hide actions
      setSwipedId(null);
    }
    touchStartRef.current = null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Filters bar */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeStatus === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchInput}
              onChange={handleSearch}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3"
          >
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedIds.size} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn-danger text-sm px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice list */}
      {loading ? (
        <LoadingSpinner />
      ) : invoices.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title={searchQuery || activeStatus !== 'all' ? 'No matching invoices' : 'No invoices yet'}
            description={
              searchQuery || activeStatus !== 'all'
                ? 'Try adjusting your search or filters to find what you need.'
                : 'Create your first invoice and start getting paid faster.'
            }
            action={
              !searchQuery && activeStatus === 'all' ? (
                <button
                  onClick={() => navigate('/invoices/new')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={invoices.length > 0 && selectedIds.size === invoices.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      aria-label="Select all invoices"
                    />
                  </th>
                  {SORTABLE_COLS.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 cursor-pointer select-none group hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <span className={`transition-opacity ${
                          currentSort === key || currentSort === `-${key}`
                            ? 'text-primary-500 opacity-100'
                            : 'opacity-30 group-hover:opacity-60'
                        }`}>
                          <SortIcon field={key} />
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((inv) => {
                  const StatusIcon = STATUS_ICONS[inv.status];
                  return (
                    <tr
                      key={inv._id}
                      className={`transition-colors cursor-pointer ${
                        selectedIds.has(inv._id)
                          ? 'bg-primary-50/50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      onMouseEnter={(e) => handleRowMouseEnter(inv, e)}
                      onMouseLeave={handleRowMouseLeave}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv._id)}
                          onChange={() => toggleSelect(inv._id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          aria-label={`Select invoice ${inv.invoiceNumber}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{inv.clientName}</p>
                        {inv.clientEmail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{inv.clientEmail}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(inv.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            STATUS_STYLES[inv.status]
                          }`}
                        >
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/invoices/${inv._id}/edit`)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              deleteId === inv._id
                                ? 'text-red-600 bg-red-50'
                                : 'text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={deleteId === inv._id ? 'Click again to confirm' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Hover preview portal */}
          <AnimatePresence>
            {hoveredInvoice && hoverPosition && (
              <HoverPreview invoice={hoveredInvoice} position={hoverPosition} />
            )}
          </AnimatePresence>

          {/* Mobile cards with swipe */}
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => {
              const StatusIcon = STATUS_ICONS[inv.status];
              const isSwiped = swipedId === inv._id;
              return (
                <div key={inv._id} className="relative overflow-hidden rounded-xl">
                  {/* Swipe-revealed action buttons (behind the card) */}
                  <div className="absolute inset-y-0 right-0 flex items-stretch">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${inv._id}/edit`);
                      }}
                      className="w-16 flex items-center justify-center bg-primary-500 text-white"
                      aria-label="Edit invoice"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(inv._id);
                      }}
                      className={`w-16 flex items-center justify-center text-white ${
                        deleteId === inv._id ? 'bg-red-700' : 'bg-red-500'
                      }`}
                      aria-label={deleteId === inv._id ? 'Confirm delete' : 'Delete invoice'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Card body — slides left on swipe */}
                  <motion.div
                    animate={{ x: isSwiped ? -128 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer"
                    onClick={() => isSwiped ? setSwipedId(null) : navigate(`/invoices/${inv._id}`)}
                    onTouchStart={(e) => handleTouchStart(inv._id, e)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(inv._id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                          aria-label={`Select invoice ${inv.invoiceNumber}`}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{inv.clientName}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_STYLES[inv.status]
                        }`}
                      >
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between ml-7">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(inv.total)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(inv.createdAt)}
                      </span>
                    </div>
                    {/* Swipe hint */}
                    {!isSwiped && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20">
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn-secondary p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="btn-secondary p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Invoices;
