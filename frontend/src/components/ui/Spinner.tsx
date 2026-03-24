import { cn } from "../../lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "brand";
  className?: string;
}

const sizeClasses = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
const colorClasses = { white: "text-white", brand: "text-brand-600" };

export function Spinner({
  size = "md",
  color = "brand",
  className,
}: SpinnerProps) {
  return (
    <svg
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a* 8 0 018-8V0c5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
