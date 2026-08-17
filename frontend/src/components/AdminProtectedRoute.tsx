import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
