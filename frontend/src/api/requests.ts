// ─── API LAYER —————
// This file is the ONLY place in the frontend that knows API route strings.
// All pages import functions from here — none construct URLs themselves.
//
// If a backend route changes (e.g. /requests -> /api/v2/requests),
// only one line (in here) will need to be updated. Nothing in any page component changes.
//
// apiClient is the Axios instance from lib/apiClient.ts.
// It already has baseURL, JWT injection, and 401 handling configured.
// Never import axios directly in page components — always use apiClient.

import { apiClient } from "../lib/apiClient";
import type { Request, StatusEvent, UpdateStatusInput } from "../types";

// ─── GET /requests —————
// Fetches all requests visible to the calling user.
// The SAME endpoint returns different data depending on the caller's Cognito group:
//   • Client users -> only their own requests (filtered in Lambda by clientId)
//   • Admin users  -> ALL requests across all clients
// One endpoint, two behaviors — the JWT tells Lambda who is calling.
//
// Named getRequests (plural) — matches the import in DashboardPage
// and AdminDashboardPage. Do not rename to getAllRequests.
export async function getRequests(): Promise<Request[]> {
  const response = await apiClient.get<Request[]>("/requests");
  return response.data;
}

// ─── GET /requests/:requestId —————
// Fetches a single request by ID.
// Used by both RequestDetailPage (client view) and AdminRequestDetail (admin view).
// The backend uses QueryCommand (not GetCommand) because cf-requests has a
// composite key (requestId HASH + clientId RANGE) — GetCommand requires both
// keys, but callers only know the requestId. QueryCommand on the hash key alone
// returns the item without needing clientId.
export async function getRequest(requestId: string): Promise<Request> {
  const response = await apiClient.get<Request>(`/requests/${requestId}`);
  return response.data;
}

// ─── GET /requests/:requestId/events —————
// Fetches the status timeline for a request.
// Returns events in ascending chronological order (oldest -> newest).
// The Lambda does an ownership check via a projection-only query on cf-requests
// before fetching events — non-owners get 404 (not 403) to avoid leaking
// whether a request exists at all.
export async function getStatusEvents(
  requestId: string,
): Promise<StatusEvent[]> {
  const response = await apiClient.get<StatusEvent[]>(
    `/requests/${requestId}/events`,
  );
  return response.data;
}

// ─── POST /requests —————
// Submits a new service request. Returns the created request object.
// Called by SubmitRequestPage via useMutation.
// data type is unknown here — SubmitRequestPage passes a Zod-validated form
// object. The backend stamps requestId (UUID), clientId (from JWT sub),
// createdAt (ISO timestamp), and initial status = PENDING.
export async function createRequest(data: unknown): Promise<Request> {
  const response = await apiClient.post<Request>("/requests", data);
  return response.data;
}

// ─── PATCH /requests/:requestId/status —————
// Updates the status of a request. Admin-only endpoint.
// Lambda returns 403 if the caller is not in the Cognito "admin" group.
// Note: cognito:groups is a space-separated string in HTTP API v2, not an array
// — the Lambda splits on space before checking for "admin".
// Returns the updated requestId, new status, and timestamp of the change.
export async function updateRequestStatus(input: UpdateStatusInput): Promise<{
  requestId: string;
  status: string;
  timestamp: string;
}> {
  const response = await apiClient.patch(
    `/requests/${input.requestId}/status`,
    { status: input.status, note: input.note },
  );
  return response.data;
}

// ─── GET /upload-url —————
// Requests a pre-signed S3 PUT URL from Lambda.
// contentType must match the file being uploaded (e.g. "image/png", "application/pdf").
// Lambda generates a URL valid for 600 seconds that authorizes a PUT to a
// specific S3 key. The URL contains embedded AWS credentials in its query string.
//
// Returns:
//   uploadUrl  — used by upload.service.ts to PUT the file directly to S3
//   objectKey  — stored in the request form as attachmentKey
//
// IMPORTANT: The S3 PUT in upload.service.ts uses fetch(), not apiClient.
// apiClient would inject a Cognito JWT header that S3 would reject — the
// pre-signed URL already contains its own auth. Two auth schemes = S3 error.
export async function getUploadUrl(contentType: string): Promise<{
  uploadUrl: string;
  objectKey: string;
}> {
  const response = await apiClient.get("/upload-url", {
    params: { contentType },
  });
  return response.data;
}
