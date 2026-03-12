import { Navigate } from "react-router";
import { useAuthStore } from "../../stores/auth.store.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  permission?: string;
}

export function ProtectedRoute({ children, adminOnly, permission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuthStore();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/app/dashboard" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}
