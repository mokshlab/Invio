import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Auto-generated breadcrumbs from the current URL path.
 * Maps route segments to human-readable labels.
 */
const LABELS = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  new: 'New Invoice',
  edit: 'Edit',
  profile: 'Profile',
  'ai-creator': 'AI Creator',
};

const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on top-level pages
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;
    // Use label map, or show ID as "# + first 6 chars" for mongo IDs
    const label = LABELS[seg] || (seg.length === 24 ? `#${seg.slice(-6)}` : seg);

    return { label, path, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-4">
      <Link
        to="/dashboard"
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          {crumb.isLast ? (
            <span className="text-gray-700 dark:text-gray-300 font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
