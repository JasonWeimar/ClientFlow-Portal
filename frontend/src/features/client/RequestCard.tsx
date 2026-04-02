import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../requests/StatusBadge";
import { formatDate, serviceTypeLabel } from "../../lib/utils";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import type { Request } from "../../types";

interface RequestCardProps {
  request: Request;
}

export function RequestCard({ request }: RequestCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/requests/${request.requestId}`)}
      className={[
        "w-full flex items-center justify-between",
        "bg-white rounded-lg border border-slate-200 shadow-sm",
        "px-5 py-4 min-h-[72px]",
        "hover:bg-slate-50 hover:shadow-md",
        "transition-all duration-150 cursor-pointer",
        "text-left",
      ].join(" ")}
    >
      {/* Left — service type + date */}
      <div className="flex flex-col gap-1 w-40 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900">
          {serviceTypeLabel[request.serviceType]}
        </span>
        <span className="text-xs text-slate-400">
          {formatDate(request.createdAt)}
        </span>
      </div>

      {/* Center — description snippet */}
      <p className="flex-1 text-sm text-slate-500 truncate px-4">
        {request.description}
      </p>

      {/* Right — status badge + chevron */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <StatusBadge status={request.status} />
        <ChevronRightIcon className="w-4 h-4 text-slate-400" />
      </div>
    </button>
  );
}
