// ——— frontend/src/router/ProtectedRoute.tsx — Auth guard component ———
// ProtectedRoute wraps any routes that require authentication.
// If the auth check is in progress (loading=true), show a spinner.
// If there is no user, redirect to /login (preserving the intended destination).
// If there is a user, render the child routes via <Outlet />.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Amplify is restoring the session, show a spinner instead of
  // redirecting. Without this check, returning users with valid sessions
  // would be flashed to the login screen before auth resolves.
  if (loading) return <LoadingSpinner fullscreen />;

  if (!user) {
    // state={{ from: location }} preserves the URL the user was trying to reach.
    // The LoginPage can read this with useLocation() and redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated — render the child routes
  return <Outlet />;
}
