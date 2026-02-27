import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceService } from '../services/invoiceService';
import { aiService } from '../services/aiService';
import {
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Users,
} from 'lucide-react';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const STATUS_BADGES = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

const PIE_COLORS = {
  draft: '#9ca3af',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');

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

  const fetchInsights = async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const { data } = await aiService.getInsights();
      setInsights(data.insights);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate insights';
      setInsightsError(msg);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fmt = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

  const fmtCompact = (v) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(v || 0);

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
  const monthlyRevenue = stats?.monthlyRevenue || [];
  const topClients = stats?.topClients || [];

  // Transform monthly data for Recharts
  const revenueChartData = monthlyRevenue.map((m) => ({
    name: `${MONTHS[m._id.month - 1]} ${String(m._id.year).slice(2)}`,
    revenue: m.revenue,
    count: m.count,
  }));

  // Transform status data for pie chart
  const pieData = statusBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count,
      color: PIE_COLORS[s._id] || '#9ca3af',
    }));

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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue bar chart — spans 2 cols */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Monthly Revenue
          </h2>
          {revenueChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              <TrendingUp className="w-12 h-12 mb-3 stroke-1" />
              <p className="text-sm">No paid invoices yet</p>
              <p className="text-xs mt-1">Revenue chart will appear here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtCompact(v)}
                />
                <Tooltip
                  formatter={(v) => [fmt(v), 'Revenue']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '0.875rem',
                  }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Status Breakdown
          </h2>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              <FileText className="w-12 h-12 mb-3 stroke-1" />
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                  }}
                  formatter={(v) => [`${v} invoices`, '']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: Recent Invoices + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
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
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {inv.clientName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {inv.invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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

        {/* Top Clients */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Clients
          </h2>
          {topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <Users className="w-12 h-12 mb-3 stroke-1" />
              <p className="text-sm">No client data yet</p>
              <p className="text-xs mt-1">Clients will appear as you create invoices</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-600">
                        {client._id?.charAt(0)?.toUpperCase() || '#'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {client._id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                    {fmt(client.totalRevenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Widget */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Insights</h2>
          </div>
          <button
            onClick={fetchInsights}
            disabled={insightsLoading}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
          >
            {insightsLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {insights ? 'Refresh' : 'Generate'}
              </>
            )}
          </button>
        </div>

        {/* Not loaded yet */}
        {!insights && !insightsLoading && !insightsError && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <Sparkles className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm">Click &quot;Generate&quot; to get AI-powered business insights</p>
            <p className="text-xs mt-1">Requires at least 2 invoices</p>
          </div>
        )}

        {/* Error */}
        {insightsError && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
            {insightsError}
          </div>
        )}

        {/* Loading shimmer */}
        {insightsLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        )}

        {/* Insights data */}
        {insights && !insightsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Revenue Trend */}
            {insights.revenueTrend && (
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      insights.revenueTrend.direction === 'up'
                        ? 'text-emerald-500'
                        : insights.revenueTrend.direction === 'down'
                        ? 'text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Trend</span>
                  {insights.revenueTrend.percentage && (
                    <span
                      className={`text-xs font-medium ${
                        insights.revenueTrend.direction === 'up'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {insights.revenueTrend.percentage}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {insights.revenueTrend.summary}
                </p>
              </div>
            )}

            {/* Payment Health */}
            {insights.paymentHealth && (
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Payment Health</span>
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
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {insights.paymentHealth.summary}
                </p>
              </div>
            )}

            {/* Top Recommendation */}
            {insights.recommendations?.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  Top Recommendation
                </span>
                <p className="text-xs font-medium text-primary-700 mb-1">
                  {insights.recommendations[0].title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {insights.recommendations[0].description}
                </p>
              </div>
            )}

            {/* Fun fact — full width */}
            {insights.funFact && (
              <div className="bg-primary-50 rounded-xl p-4 md:col-span-2 lg:col-span-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary-800">{insights.funFact}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
