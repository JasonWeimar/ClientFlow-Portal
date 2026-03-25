import { statusColors, statusLabel, formatDateTime } from "../../lib/utils";
import type { StatusEvent as StatusEventType, UserRole } from "../../types";

interface StatusEventProps {
  event: StatusEventType;
  role?: UserRole;
}

export function StatusEvent({ event, role = "client" }: StatusEventProps) {
  const { bg, text } = statusColors[event.status];

  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${text.replace("text-", "bg-")}`}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${text}`}>
              {statusLabel[event.status]}
            </span>
            {event.adminOnly && role === "admin" && (
              <span className="text-xs text-slate-400">🔒 Internal</span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {formatDateTime(event.timestamp)}
          </span>
          {event.note && (
            <p className="text-sm text-slate-600 mt-1">{event.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
