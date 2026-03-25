import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

// Generic badge — unstyled container
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px--2.5 py-1 rounded-full",
        "text-xs font-medium tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
