// This page Combines read (useQuery x2) and write (useMutation).
// Shows request details, status timeline, and the status update form.

import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getRequest,
  getStatusEvents,
  updateRequestStatus,
} from "../../api/requests";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { StatusBadge } from "../requests/StatusBadge";
import { StatusTimeline } from "../requests/StatusTimeline";
import { MetadataGrid } from "../requests/MetadataGrid";
import { AdminNoteForm } from "./AdminNoteForm";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import type { Request, StatusEvent } from "../../types";

// Zod schema for the status update form.
// z.enum() validates that status is one of the known values — TypeScript + runtime safety.
const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_REVIEW", "APPROVED", "COMPLETED", "REJECTED"]),
  note: z.string().max(1000).optional(),
});

type UpdateStatusValues = z.infer<typeof UpdateStatusSchema>;

export default function AdminRequestDetail() {
  const { requestId } = useParams<{ requestId: string }>();

  // useQueryClient gives access to the global cache for manual invalidation.
  // Must be called at component level — not inside event handlers.
  const queryClient = useQueryClient();

  // ── Read: fetch request and events in parallel ─————
  const { data: request, isLoading: requestLoading } = useQuery<Request>({
    queryKey: ["requests", requestId],
    queryFn: () => getRequest(requestId!),
    enabled: !!requestId,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<StatusEvent[]>({
    queryKey: ["status-events", requestId],
    queryFn: () => getStatusEvents(requestId!),
    enabled: !!requestId,
  });

  // ── Status update form —————
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateStatusValues>({
    resolver: zodResolver(UpdateStatusSchema),
    // Pre-populate with current status so the select shows the right value.
    // Note: request may be undefined on first render — RHF handles this gracefully.
    defaultValues: { status: request?.status, note: "" },
  });

  // ── Write: useMutation for the status PATCH —————
  const mutation = useMutation({
    mutationFn: (data: UpdateStatusValues) =>
      updateRequestStatus({ requestId: requestId!, ...data }),

    onSuccess: () => {
      // Invalidate all three cache entries:
      //   1. This specific request record (updates StatusBadge + MetadataGrid)
      queryClient.invalidateQueries({ queryKey: ["requests", requestId] });
      //   2. The status events for this request (updates StatusTimeline)
      queryClient.invalidateQueries({ queryKey: ["status-events", requestId] });
      //   3. The full request list (updates AdminDashboard stat counts)
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const isLoading = requestLoading || eventsLoading;

  return (
    <PageWrapper
      title="Request Detail"
      back={
        <Button variant="ghost" as={Link} to="/admin">
          ← All requests
        </Button>
      }
    >
      {isLoading && <LoadingSpinner />}

      {request && !isLoading && (
        <div className="space-y-8">
          {/* Header: Request ID, client email, current status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono text-sm">{request.requestId}</p>
              <p className="text-sm text-gray-500 mt-1">
                Client: {request.clientEmail}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* Request metadata */}
          <MetadataGrid request={request} />

          {/* Status update form — admin-only section */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Update Status
            </h3>
            <form
              onSubmit={handleSubmit((d) => mutation.mutate(d))}
              className="space-y-3"
            >
              <Select
                label="New status"
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "IN_REVIEW", label: "In Review" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "REJECTED", label: "Rejected" },
                ]}
                error={errors.status?.message}
                {...register("status")}
              />

              {/* AdminNoteForm renders a Textarea for the optional admin note */}
              <AdminNoteForm register={register} error={errors.note?.message} />

              {mutation.isError && (
                <p className="text-sm text-red-600">
                  Failed to update status. Please try again.
                </p>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? "Updating..." : "Update status"}
              </Button>
            </form>
          </div>

          {/* Status timeline — updates after mutation.onSuccess invalidates cache */}
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
