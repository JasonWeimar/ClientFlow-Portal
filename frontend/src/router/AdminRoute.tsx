import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
