// ———  frontend/src/router/index.tsx — React Router v6 configuration ———
// The router defines the entire URL structure of the application.
// We use React Router v6 with a layout-based approach:
// RootLayout wraps ALL routes (provides Navbar, Footer)
// AuthLayout wraps only authenticated routes (redirects to /login if not authed)
// AdminLayout wraps only admin routes (redirects to /dashboard if not admin)

import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

// lazy() enables code splitting — each page is a separate JS chunk.
// The browser only downloads the code for the page it is currently on.
// This significantly reduces initial bundle size and load time.
const HomePage = lazy(() => import("../features/marketing/HomePage"));
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const SignUpPage = lazy(() => import("../features/auth/SignUpPage"));
const DashboardPage = lazy(() => import("../features/client/DashboardPage"));
const SubmitPage = lazy(() => import("../features/requests/SubmitRequestPage"));
const RequestDetail = lazy(
  () => import("../features/client/RequestDetailPage"),
);
const AdminDashboard = lazy(
  () => import("../features/admin/AdminDashboardPage"),
);
const AdminDetail = lazy(() => import("../features/admin/AdminRequestDetail"));

import { RootLayout } from "../components/layout/RootLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // Provides shared Navbar + Footer
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "login",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "signup",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SignUpPage />
          </Suspense>
        ),
      },

      // Authenticated routes — ProtectedRoute checks useAuth() and redirects to /login if no user
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: "requests/new",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <SubmitPage />
              </Suspense>
            ),
          },
          {
            path: "requests/:requestId",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <RequestDetail />
              </Suspense>
            ),
          },
        ],
      },

      // Admin-only routes — AdminRoute checks isAdmin and redirects to /dashboard if not admin
      {
        element: <AdminRoute />,
        children: [
          {
            path: "admin",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: "admin/requests/:requestId",
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDetail />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
