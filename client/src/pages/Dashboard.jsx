import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceService } from '../services/invoiceService';
import {
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Send,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STATUS_BADGES = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await invoiceService.getStats();
        setStats(data.stats);
        setRecentInvoices(data.recentInvoices || []);
      } catch {
        // Stats will remain null — cards show 0
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmt = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

  const totalInvoices = stats?.totalInvoices || 0;

  const totalRevenue = stats?.totalRevenue || 0;

  const pendingCount = stats
    ? (stats.statusBreakdown || [])
        .filter((b) => b._id === 'sent' || b._id === 'overdue')
        .reduce((s, b) => s + b.count, 0)
    : 0;

  const currentMonthRevenue = stats?.monthlyRevenue?.length
    ? stats.monthlyRevenue[stats.monthlyRevenue.length - 1].revenue
    : 0;

  const statusBreakdown = stats?.statusBreakdown || [];

  const cards = [
    {
      label: 'Total Invoices',
      value: totalInvoices,
      icon: FileText,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      label: 'Total Revenue',
      value: fmt(totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'This Month',
      value: fmt(currentMonthRevenue),
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600',
    },
  ];



  return (
    <div>
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s an overview of your invoicing activity.
          </p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Invoices
                </h2>
                {recentInvoices.length > 0 && (
                  <Link
                    to="/invoices"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mb-3 stroke-1" />
                  <p className="text-sm">No invoices yet</p>
                  <p className="text-xs mt-1">
                    Create your first invoice to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((inv) => (
                    <div
                      key={inv._id}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {inv.clientName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {inv.invoiceNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {fmt(inv.total)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_BADGES[inv.status]
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Status Breakdown */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Invoice Breakdown
              </h2>
              {!statusBreakdown.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mb-3 stroke-1" />
                  <p className="text-sm">No data available</p>
                  <p className="text-xs mt-1">
                    Insights will appear as you create invoices
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { key: 'draft', label: 'Draft', icon: FileText, color: 'text-gray-600', bar: 'bg-gray-400' },
                    { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-600', bar: 'bg-blue-500' },
                    { key: 'paid', label: 'Paid', icon: CheckCircle, color: 'text-emerald-600', bar: 'bg-emerald-500' },
                    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', bar: 'bg-red-500' },
                  ].map((s) => {
                    const found = statusBreakdown.find(
                      (b) => b._id === s.key
                    );
                    const count = found?.count || 0;
                    const pct =
                      totalInvoices > 0
                        ? Math.round((count / totalInvoices) * 100)
                        : 0;
                    return (
                      <div key={s.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-sm font-medium text-gray-700">
                              {s.label}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${s.bar} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
