// The five lifecycle states a service request moves through.
// Used as a discriminated union — TypeScript will error if any
// handler assigns a string that isn't one of these five values.
export type RequestStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED";

// The primary data record written to cf-requests on creation.
// Maps 1:1 to a DynamoDB item — every field is a top-level attribute.
export interface ServiceRequest {
  // uuidv4 generated at creation time — DynamoDB partition key.
  requestId: string;
  // Cognito sub claim — identifies which user owns this request.
  clientId: string;
  // Pulled from the JWT email claim — used by sendNotification for SES.
  clientEmail: string;
  // Free-form service category submitted by the client.
  serviceType: string;
  // Full description of the work requested.
  description: string;
  // ISO date string (YYYY-MM-DD) of the client's preferred start date.
  preferredDate?: string;
  // Current lifecycle state — updated by admin via updateStatus Lambda.
  status: RequestStatus;
  // S3 object key of the uploaded file, or null if no file was attached.
  attachmentKey: string | null;
  // ISO 8601 timestamp set at creation — never mutated after that.
  createdAt: string;
  // ISO 8601 timestamp updated every time the status changes.
  updatedAt: string;
}

// An immutable audit record written to cf-status-events on every
// status change. The client portal's StatusTimeline component reads
// from this table to render the request history.
export interface StatusEvent {
  // References the parent ServiceRequest — DynamoDB partition key.
  requestId: string;
  // ISO 8601 timestamp — DynamoDB sort key, enables chronological queries.
  createdAt: string;
  // The status before this change, or null for the initial PENDING event.
  previousStatus: RequestStatus | null;
  // The status after this change.
  newStatus: RequestStatus;
  // Cognito sub of the admin who made the change, or "system" on creation.
  changedBy: string;
  // Optional admin note shown in the client's status timeline.
  note: string;
}

// The shape every Lambda handler must return to API Gateway.
// API Gateway HTTP API v2 requires statusCode, headers, and body
// as a JSON string — this interface enforces that contract.
export interface LambdaResponse {
  statusCode: number;
  // Record<string, string> covers all CORS and content-type headers.
  headers: Record<string, string>;
  // Always JSON.stringify'd — API Gateway passes this string to the client.
  body: string;
}
