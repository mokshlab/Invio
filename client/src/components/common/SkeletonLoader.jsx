/**
 * Reusable shimmer skeleton components for loading states.
 */

const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Single stat card skeleton ───
export const StatCardSkeleton = () => (
  <div className="card">
    <Pulse className="w-10 h-10 rounded-lg mb-3" />
    <Pulse className="h-7 w-24 mb-2" />
    <Pulse className="h-4 w-16" />
  </div>
);

// ─── Chart skeleton ───
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className="card">
    <Pulse className="h-5 w-36 mb-4" />
    <div className={`${height} flex items-end gap-2`}>
      {[40, 65, 50, 80, 60, 75].map((h, i) => (
        <Pulse key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

// ─── Table row skeleton ───
export const TableRowSkeleton = ({ cols = 5 }) => (
  <div className="flex items-center gap-4 p-4">
    {Array.from({ length: cols }).map((_, i) => (
      <Pulse key={i} className="h-4 flex-1" />
    ))}
  </div>
);

// ─── Invoice list skeleton ───
export const InvoiceListSkeleton = ({ rows = 5 }) => (
  <div className="card p-0 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Pulse className="h-5 w-32" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Pulse className="w-9 h-9 rounded-lg" />
            <div>
              <Pulse className="h-4 w-28 mb-1.5" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
          <div className="text-right">
            <Pulse className="h-4 w-16 mb-1.5 ml-auto" />
            <Pulse className="h-5 w-14 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Dashboard full skeleton ───
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Pulse className="h-7 w-56 mb-2" />
        <Pulse className="h-4 w-72" />
      </div>
      <Pulse className="h-10 w-32 rounded-lg" />
    </div>
    {/* Stat cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  </div>
);

export default {
  StatCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  InvoiceListSkeleton,
  DashboardSkeleton,
};
