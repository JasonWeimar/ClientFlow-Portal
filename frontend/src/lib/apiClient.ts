// ———  frontend/src/lib/apiClient.ts — Axios instance with JWT injection ———
// apiClient.ts creates a pre-configured Axios instance.
// All API calls in the application use this instance — never raw fetch() or new axios().
// Ensures the base URL and JWT auth header are applied consistently.

import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

export const apiClient = axios.create({
  // baseURL: all requests are relative to this URL.
  // import.meta.env.VITE_API_BASE_URL == API Gateway invoke URL.
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // timeout: abort requests that take longer than 10 seconds.
  // This prevents the UI from hanging indefinitely on slow Lambda cold starts.
  timeout: 10_000,
});

// Request Interceptor: runs before EVERY outgoing request.
// Injects the Cognito JWT ID token into the Authorization header.
// This is what API Gateway's JWT Authorizer validates to authenticate the request.
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    if (token) {
      // note: Authorization header must use the 'Bearer' scheme.
      // API Gateway's JWT Authorizer extracts the token after 'Bearer '.
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // If there is no session (logged out), the header is omitted.
    // API Gateway will return 401, which the response interceptor handles.
  }
  return config;
});

// Response Interceptor: runs after EVERY response.
// Handles 401 errors globally — redirects to login without per-component handling.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired and refresh failed — redirect to login.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
