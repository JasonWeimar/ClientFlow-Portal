import { Badge } from "../../components/ui/Badge";
import { statusColors, statusLabel } from "../../lib/utils";
import type { RequestStatus } from "../../types";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { bg, text } = statusColors[status];
  return (
    <Badge className={`${bg} ${text} ${className ?? ""}`}>
      {statusLabel[status]}
    </Badge>
  );
}

// Usage:
// <StatusBadge status='PENDING' />
// <StatusBadge status={request.status} />
