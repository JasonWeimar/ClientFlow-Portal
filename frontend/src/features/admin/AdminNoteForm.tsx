import { Textarea } from "../../components/ui/Textarea";
import type { UseFormRegister } from "react-hook-form";

interface AdminNoteFormProps {
  register: UseFormRegister<{
    status: "PENDING" | "IN_REVIEW" | "APPROVED" | "COMPLETED" | "REJECTED";
    note?: string | undefined;
  }>;
  error?: string;
}

export function AdminNoteForm({ register, error }: AdminNoteFormProps) {
  return (
    <Textarea
      label="Note (optional)"
      placeholder="Add a note visible to the client..."
      rows={4}
      error={error}
      {...register("note")}
    />
  );
}
