import { formatDate, serviceTypeLabel } from "../../lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Request } from "../../types";

interface MetadataGridProps {
  request: Request;
}

interface MetadataCell {
  label: string;
  value: React.ReactNode;
}

export function MetadataGrid({ request }: MetadataGridProps) {
  const cells: MetadataCell[] = [
    { label: "Service Type", value: serviceTypeLabel[request.serviceType] },
    { label: "Status", value: <StatusBadge status={request.status} /> },
    { label: "Submitted", value: formatDate(request.createdAt) },
    {
      label: "Preferred Date",
      value: request.preferredDate ? (
        formatDate(request.preferredDate)
      ) : (
        <span className="text-slate-400">Not specified</span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cells.map((cell) => (
        <div key={cell.label} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {cell.label}
          </span>
          <span className="text-sm text-slate-900">{cell.value}</span>
        </div>
      ))}
    </div>
  );
}
