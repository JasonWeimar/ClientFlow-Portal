// - REQUEST TYPES —————
export type RequestStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED";

export type ServiceType = "consulting" | "design" | "development" | "support";

export interface Request {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  description: string;
  status: RequestStatus;
  createdAt: string;
  preferredDate?: string;
  attachmentKey?: string;
}

export interface StatusEvent {
  requestId: string;
  timestamp: string;
  status: RequestStatus;
  note?: string;
  adminOnly?: boolean;
}

// — USER TYPES —————

export type UserRole = "client" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// — FORM TYPES —————

export interface CreateRequestInput {
  serviceType: ServiceType;
  description: string;
  preferredDate?: string;
  attachmentKey?: File;
}

export interface UpdateStatusInput {
  requestId: string;
  status: RequestStatus;
  note?: string;
  adminOnly?: boolean;
}

// — API RESPONSE TYPES —————

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export type RequestsResponse = ApiResponse<Request[]>;
export type RequestResponse = ApiResponse<Request>;
export type StatusEventResponse = ApiResponse<StatusEvent[]>;
