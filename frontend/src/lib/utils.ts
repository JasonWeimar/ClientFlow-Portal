import type { RequestStatus, ServiceType } from "../types";

// — STATUS UTILITIES —————

// Maps status enum to display label

export const statusLabel: Record<RequestStatus, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Maps status to Tailwind color classes (bg + text pair)

export const statusColors: Record<RequestStatus, { bg: string; text: string }> =
  {
    PENDING: { bg: "bg-status-pending-bg", text: "text-status-pending" },
    IN_REVIEW: { bg: "bg-status-review-bg", text: "text-status-review" },
    APPROVED: { bg: "bg-status-approved-bg", text: "text-status-approved" },
    COMPLETED: { bg: "bg-status-completed-bg", text: "text-status-completed" },
    REJECTED: { bg: "bg-status-rejected-bg", text: "text-status-rejected" },
  };

// Maps ServiceType to display label

export const serviceTypeLabel: Record<ServiceType, string> = {
  consulting: "Consulting",
  design: "Design",
  development: "Development",
  support: "Support",
};

// — DATE UTILITIES —————

//  Formats ISO date string to 'Mar 15, 2026'
export function formatDate(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Formats ISO date string to 'Mar 15, 2026 at 3:00 PM'
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

//  — CLASS UTILITIES —————

// Joins Tailwind class strings, filtering out falsy values

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
