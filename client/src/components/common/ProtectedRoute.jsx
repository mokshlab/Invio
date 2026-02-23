import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wrapper that redirects unauthenticated users to /login.
 * Shows a full-screen spinner while auth state is being resolved.
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
