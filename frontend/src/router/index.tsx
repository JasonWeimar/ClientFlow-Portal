// ———  frontend/src/router/index.tsx — React Router v6 configuration ———
// The router defines the entire URL structure of the application.
// We use React Router v6 with a layout-based approach:
// RootLayout wraps ALL routes (provides Navbar, Footer)
// AuthLayout wraps only authenticated routes (redirects to /login if not authed)
// AdminLayout wraps only admin routes (redirects to /dashboard if not admin)

import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import { RootLayout } from "../components/layout/RootLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { S } from "./SuspenseWrapper";

// lazy() enables code splitting — each page is a separate JS bundle.
// lazy() takes a function that returns a dynamic import().
// The browser only downloads the code for the page it is currently on.
// This significantly reduces initial bundle size and load time.
// const HomePage = lazy(() => import("../features/marketing/HomePage")); --- //TODO- Build Homepage.tsx
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const SignUpPage = lazy(() => import("../features/auth/SignUpPage"));
const ConfirmEmailPage = lazy(
  () => import("../features/auth/ConfirmEmailPage"),
);
const DashboardPage = lazy(() => import("../features/client/DashboardPage"));
const RequestDetailPage = lazy(
  () => import("../features/client/RequestDetailPage"),
);
const AdminDashboardPage = lazy(
  () => import("../features/admin/AdminDashboardPage"),
);
const AdminRequestDetail = lazy(
  () => import("../features/admin/AdminRequestDetail"),
);
const SubmitRequestPage = lazy(
  () => import("../features/requests/SubmitRequestPage"),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ── Public routes — no authentication required ─────
      {
        index: true,
        element: (
          <S>
            <LoginPage />
          </S>
        ),
      }, // / → Login (or your HomePage)
      {
        path: "login",
        element: (
          <S>
            <LoginPage />
          </S>
        ),
      },
      {
        path: "signup",
        element: (
          <S>
            <SignUpPage />
          </S>
        ),
      },
      {
        path: "confirm-email",
        element: (
          <S>
            <ConfirmEmailPage />
          </S>
        ),
      },

      // ── Protected client routes — must be authenticated ──────
      // ProtectedRoute checks useAuth().isAuthenticated.
      // If false, it redirects to /login while saving the intended URL in state.
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "dashboard",
            element: (
              <S>
                <DashboardPage />
              </S>
            ),
          },
          {
            path: "requests/new",
            element: (
              <S>
                <SubmitRequestPage />
              </S>
            ),
          },
          {
            path: "requests/:requestId",
            element: (
              <S>
                <RequestDetailPage />
              </S>
            ),
          },

          // ── Protected admin routes — must be authenticated AND in admin group ─
          // AdminRoute checks useAuth().isAdmin (or the admin Cognito group claim).
          // AdminRoute is nested inside ProtectedRoute — both guards run.
          {
            element: <AdminRoute />,
            children: [
              {
                path: "admin",
                element: (
                  <S>
                    <AdminDashboardPage />
                  </S>
                ),
              },
              {
                path: "admin/requests/:requestId",
                element: (
                  <S>
                    <AdminRequestDetail />
                  </S>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);

// In main.tsx, use:
// import { router } from './router'
// import { RouterProvider } from 'react-router-dom'
// <RouterProvider router={router} />
