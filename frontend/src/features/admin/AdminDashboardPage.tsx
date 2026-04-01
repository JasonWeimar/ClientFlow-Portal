import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequests } from "../../api/requests";
import { RequestTable } from "./RequestTable";
import { StatCard } from "./StatCard";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Select } from "../../components/ui/Select";
import type { Request, RequestStatus } from "../../types";

// 'ALL' is a UI-only value — not a real database status.
// It means "show everything" when selected.
const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminDashboardPage() {
  // statusFilter is local UI state — React manages it, not the server.
  // Changing the filter does NOT trigger a network request.
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL",
  );

  // Same queryKey as DashboardPage — both use ['requests'].
  // If the admin navigated from DashboardPage, this returns cached data instantly.
  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery<Request[]>({
    queryKey: ["requests"],
    queryFn: getRequests,
  });

  // Derive filtered list from the same cached data — no extra API call.
  const filtered =
    requests?.filter((r) =>
      statusFilter === "ALL" ? true : r.status === statusFilter,
    ) ?? [];

  // Stat card values — computed from the full unfiltered list.
  const stats = {
    total: requests?.length ?? 0,
    pending: requests?.filter((r) => r.status === "PENDING").length ?? 0,
    inReview: requests?.filter((r) => r.status === "IN_REVIEW").length ?? 0,
    completed: requests?.filter((r) => r.status === "COMPLETED").length ?? 0,
  };

  return (
    <PageWrapper title="Admin Dashboard">
      {/* Stat cards — counts derived from cached data, not extra API calls */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard
          label="Pending"
          value={stats.pending}
          accentColor="border-status-pending"
        />
        <StatCard
          label="In Review"
          value={stats.inReview}
          accentColor="border-status-review"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          accentColor="border-status-completed"
        />
      </div>

      {/* Status filter dropdown */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <Select
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) =>
            setStatusFilter(e.target.value as RequestStatus | "ALL")
          }
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <p className="text-red-600 text-sm">
          Failed to load requests. Please refresh.
        </p>
      )}
      {!isLoading && !isError && (
        // RequestTable renders each request as a table row.
        // Each row links to /admin/requests/:requestId.
        <RequestTable requests={filtered} />
      )}
    </PageWrapper>
  );
}
