import { cn } from "../../lib/utils";

interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function Avatar({ initials, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-brand-600 text-white",
        "flex items-center justify-center font-medium flex-shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
