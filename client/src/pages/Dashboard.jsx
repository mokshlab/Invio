import { useAuth } from '../context/AuthContext';
import { FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Total Invoices',
      value: '0',
      icon: FileText,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      label: 'Total Revenue',
      value: '$0',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending',
      value: '0',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'This Month',
      value: '$0',
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your invoicing activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
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

      {/* Placeholder panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Invoices
          </h2>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm">No invoices yet</p>
            <p className="text-xs mt-1">
              Create your first invoice to get started
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AI Insights
          </h2>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <TrendingUp className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-1">
              Insights will appear as you create invoices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
