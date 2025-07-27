import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthHelpers';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasAnyPermission } = useAuth();
  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasAnyPermission([permission])) return <Navigate to="/no-access" replace />;
  return children;
} 