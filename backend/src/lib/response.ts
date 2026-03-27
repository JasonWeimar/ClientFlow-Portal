// LambdaResponse is a type only — never a runtime value.
// "import type" ensures it is erased entirely at compile time,
// producing zero output in the compiled JS.
import type { LambdaResponse } from "../types";

// CORS origin is set per-environment via Lambda env var.
// Defaults to localhost:5173 (Vite dev server) so local testing
// works without any env config. Replaced with the CloudFront URL
// after Part E via aws lambda update-function-configuration.
const CORS_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";

// Shared headers applied to every response.
// Centralising them here means a single change propagates to all
// handlers — no per-handler CORS configuration needed.
const HEADERS = {
  // Tells the browser to parse the body as JSON.
  "Content-Type": "application/json",
  // Allows the frontend origin to read the response cross-origin.
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  // Permits the Authorization header — required for JWT to reach Lambda.
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  // OPTIONS is included for preflight requests sent by the browser
  // before any non-simple cross-origin request.
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

// 200 — request succeeded, returning a resource or list.
export const ok = (data: unknown): LambdaResponse => ({
  statusCode: 200,
  headers: HEADERS,
  body: JSON.stringify(data),
});

// 201 — resource successfully created.
// Semantically distinct from 200 — clients can detect creation vs retrieval.
export const created = (data: unknown): LambdaResponse => ({
  statusCode: 201,
  headers: HEADERS,
  body: JSON.stringify(data),
});

// 400 — the request body failed Zod validation or is structurally invalid.
// msg is the Zod error message string — descriptive enough for debugging
// without exposing internal implementation details.
export const badRequest = (msg: string): LambdaResponse => ({
  statusCode: 400,
  headers: HEADERS,
  body: JSON.stringify({ error: msg }),
});

// 401 — no valid JWT present or the JWT authorizer rejected the token.
// Triggers the Axios interceptor in apiClient.ts to redirect to login.
export const unauthorized = (): LambdaResponse => ({
  statusCode: 401,
  headers: HEADERS,
  body: JSON.stringify({ error: "Unauthorized" }),
});

// 403 — valid JWT present but caller lacks the required role.
// Used by updateStatus to reject non-admin callers cleanly.
export const forbidden = (): LambdaResponse => ({
  statusCode: 403,
  headers: HEADERS,
  body: JSON.stringify({ error: "Forbidden" }),
});

// 404 — the requested resource does not exist.
// Default message is generic — pass a specific string when the context
// is clear enough to be useful (e.g. "Request not found").
export const notFound = (msg = "Not found"): LambdaResponse => ({
  statusCode: 404,
  headers: HEADERS,
  body: JSON.stringify({ error: msg }),
});

// 500 — unhandled exception caught in the handler's try/catch.
// Generic message intentional — never expose stack traces to clients.
// The actual error is logged via console.error for CloudWatch.
export const serverError = (msg = "Internal server error"): LambdaResponse => ({
  statusCode: 500,
  headers: HEADERS,
  body: JSON.stringify({ error: msg }),
});
