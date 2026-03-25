import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  heading,
  subtext,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{heading}</h3>
        {subtext && (
          <p className="text-sm text-slate-400 max-w-sm">{subtext}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
