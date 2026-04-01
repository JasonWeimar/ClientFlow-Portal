// Shows a single request and its full status history.
// Reads requestId from the URL: /requests/:requestId

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRequest, getStatusEvents } from "../../api/requests";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { StatusBadge } from "../requests/StatusBadge";
import { StatusTimeline } from "../requests/StatusTimeline";
import { MetadataGrid } from "../requests/MetadataGrid";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import type { Request, StatusEvent } from "../../types";

export default function RequestDetailPage() {
  // useParams reads dynamic segments from the current route path.
  // For route { path: "requests/:requestId" }, this returns { requestId: "abc-123" }.
  const { requestId } = useParams<{ requestId: string }>();

  // ── Query 1: Fetch the request record —————
  // queryKey: ['requests', requestId] — scoped to this specific request.
  // If DashboardPage has ['requests'] in its cache, this is a SEPARATE cache entry.
  // AdminRequestDetail uses the same queryKey — they share this cache.
  const { data: request, isLoading: requestLoading } = useQuery<Request>({
    queryKey: ["requests", requestId],
    queryFn: () => getRequest(requestId!),
    enabled: !!requestId,
  });

  // ── Query 2: Fetch status events ────—
  // Runs in parallel with Query 1 — not sequential.
  // Events arrive in ascending order from the backend (oldest first).
  const { data: events, isLoading: eventsLoading } = useQuery<StatusEvent[]>({
    queryKey: ["status-events", requestId],
    queryFn: () => getStatusEvents(requestId!),
    enabled: !!requestId,
  });

  // Combined loading flag — page shows spinner until BOTH queries complete.
  const isLoading = requestLoading || eventsLoading;

  return (
    <PageWrapper
      title="Request Details"
      back={
        <Button variant="ghost" as={Link} to="/dashboard">
          ← Back
        </Button>
      }
    >
      {isLoading && <LoadingSpinner />}

      {request && !isLoading && (
        <div className="space-y-6">
          {/* Header: Request ID + current status badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono text-sm">{request.requestId}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* MetadataGrid: service type, preferred date, description */}
          <MetadataGrid request={request} />

          {/* StatusTimeline: chronological audit trail of status changes */}
          {events && events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Status History
              </h3>
              <StatusTimeline events={events} />
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
