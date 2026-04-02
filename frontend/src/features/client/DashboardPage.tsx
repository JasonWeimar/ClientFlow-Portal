// Client home screen — shows all requests belonging to the current user.
// The backend filters by clientId automatically based on the JWT.

import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getRequests } from "../../api/requests";
import { RequestCard } from "./RequestCard";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { signOut } from "aws-amplify/auth";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import type { Request } from "../../types";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Signs out via Amplify and redirects to login.
  // signOut() clears the Cognito session and removes tokens from storage.
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // useQuery manages the full data-fetching lifecycle.
  // queryKey: ['requests'] — this is the cache key.
  //   When AdminRequestDetail calls invalidateQueries(['requests']),
  //   this query automatically refetches.
  // queryFn: getRequests — the async function that returns the data.
  //   Must return a Promise. Never call it directly — useQuery calls it for you.
  // staleTime: comes from your QueryClient config in main.tsx (30s default).
  //   Data is "fresh" for 30s — no refetch on component re-render within that window.
  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery<Request[]>({
    queryKey: ["requests"],
    queryFn: getRequests,
  });

  return (
    <PageWrapper
      title={`Welcome back, ${user?.email ?? "there"}`}
      action={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
          <Button as={Link} to="/requests/new">
            New request
          </Button>
        </div>
      }
    >
      {/* Loading state — spinner while the first fetch is in-flight */}
      {isLoading && <LoadingSpinner />}

      {/* Error state — shown if the network request failed */}
      {isError && (
        <p className="text-red-600 text-sm">
          Failed to load requests. Please refresh the page.
        </p>
      )}

      {/* Empty state — user has no requests yet */}
      {!isLoading && !isError && requests?.length === 0 && (
        <EmptyState
          title="No requests yet"
          description="Submit your first service request to get started."
          action={
            <Button as={Link} to="/requests/new">
              Submit a request
            </Button>
          }
        />
      )}

      {/* Request list — sorted newest first */}
      {requests && requests.length > 0 && (
        <div className="space-y-4">
          {[...requests]
            // IMPORTANT: spread before sort — TanStack Query returns a read-only array.
            // Calling .sort() on it directly would mutate the cache.
            // [...requests] creates a local mutable copy.
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((request) => (
              <RequestCard key={request.requestId} request={request} />
            ))}
        </div>
      )}
    </PageWrapper>
  );
}
