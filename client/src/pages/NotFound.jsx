import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found page — shown for unmatched routes.
 */
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
    <div className="max-w-md w-full text-center">
      <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileQuestion className="w-10 h-10 text-primary-600 dark:text-primary-400" />
      </div>

      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Page Not Found
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link to="/dashboard" className="btn-primary flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  </div>
);

export default NotFound;
