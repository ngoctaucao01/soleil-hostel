import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}


/**
 * ProtectedRoute - Require httpOnly cookie token
 *
 * ========== Flow ==========
 * 1. Check if user state exists
 * 2. If loading, show loading state
 * 3. If not authenticated, redirect to /login
 * 4. If authenticated, render children
 *
 * NOTE: Cannot directly check httpOnly cookie from JavaScript.
 * Instead rely on user state + Axios interceptor for auto-refresh.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // On component mount, validate token
    const validateToken = async () => {
      // Give a brief moment for auth state to initialize
      if (!loading) {
        setInitialized(true);
      }
    };

    validateToken();
  }, [loading]);

  // Still loading token validation
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No user = not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
