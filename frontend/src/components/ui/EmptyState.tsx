import { Button } from "./Button";

interface EmptyStateProps {
  // props used by DashboardPage/other pages
  title?: string;
  description?: string;
  action?: React.ReactNode;
  // original props — kept so existing usages don't break
  icon?: React.ReactNode;
  heading?: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  heading,
  description,
  subtext,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // title takes precedence over heading, description over subtext
  const displayHeading = title ?? heading;
  const displaySubtext = description ?? subtext;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {displayHeading && (
          <h3 className="text-lg font-semibold text-slate-900">
            {displayHeading}
          </h3>
        )}
        {displaySubtext && (
          <p className="text-sm text-slate-400 max-w-sm">{displaySubtext}</p>
        )}
      </div>

      {/* action accepts a ReactNode (e.g. <Button as={Link} to="...">) */}
      {action && <div>{action}</div>}

      {/* original callback-style action — still works if used elsewhere */}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
