import { Card } from "../../components/ui/Card";
import { formatDateTime, statusColors, statusLabel } from "../../lib/utils";
import type { StatusEvent, UserRole } from "../../types";

interface StatusTimelineProps {
  events: StatusEvent[];
  role?: UserRole;
}

export function StatusTimeline({
  events,
  role = "client",
}: StatusTimelineProps) {
  // Filter admin-only events for client view
  const visibleEvents = events.filter((e) =>
    role === "admin" ? true : !e.adminOnly,
  );

  return (
    <Card>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-4">
        Status History
      </h3>
      <div className="flex flex-col gap-4">
        {visibleEvents.map((event, index) => {
          const { bg, text } = statusColors[event.newStatus];
          return (
            <div key={index} className={`rounded-lg p-3 ${bg}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${text.replace("text-", "bg-")}`}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${text}`}>
                      {statusLabel[event.newStatus]}
                    </span>
                    {event.adminOnly && role === "admin" && (
                      <span className="text-xs text-slate-400">
                        🔒 Internal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(event.createdAt)}
                  </span>
                  {event.note && (
                    <p className="text-sm text-slate-600 mt-1">{event.note}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
