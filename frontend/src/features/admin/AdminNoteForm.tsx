import { useState } from "react";
import { Textarea } from "../../components/ui/Textarea";
import { Checkbox } from "../../components/ui/Checkbox";
import { Button } from "../../components/ui/Button";
import type { UpdateStatusInput, RequestStatus } from "../../types";

interface AdminNoteFormProps {
  requestId: string;
  currentStatus: RequestStatus;
  onSubmit: (input: UpdateStatusInput) => Promise<void>;
}

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

export function AdminNoteForm({
  requestId,
  currentStatus,
  onSubmit,
}: AdminNoteFormProps) {
  const [status, setStatus] = useState<RequestStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({ requestId, status, note: note || undefined, adminOnly });
      setNote("");
      setAdminOnly(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Update Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RequestStatus)}
          className="w-full h-12 px-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        label="Note (optional)"
        placeholder="Add a note visible to the client..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        showCharCount
        maxLength={500}
        rows={4}
      />

      <Checkbox
        id="admin-only"
        label="Internal note"
        description="Only visible to admins — not shown to the client"
        checked={adminOnly}
        onChange={(e) => setAdminOnly(e.target.checked)}
      />

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={status === currentStatus && !note}
        className="w-full"
      >
        Update Request
      </Button>
    </form>
  );
}
