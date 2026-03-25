import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../requests/StatusBadge";
import { formatDate, serviceTypeLabel } from "../../lib/utils";
import type { Request } from "../../types";

interface RequestTableProps {
  requests: Request[];
}

export function RequestTable({ requests }: RequestTableProps) {
  const navigate = useNavigate();

  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        No requests found.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Service
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Description
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Submitted
            </th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              onClick={() => navigate(`/admin/requests/${request.id}`)}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
              <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">
                {serviceTypeLabel[request.serviceType]}
              </td>
              <td className="px-4 py-4 text-slate-500 max-w-xs truncate">
                {request.description}
              </td>
              <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                {formatDate(request.createdAt)}
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={request.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
