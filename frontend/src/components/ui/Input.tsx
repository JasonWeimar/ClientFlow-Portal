import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full h-12 px-4 rounded-lg border bg-white",
              "text-sm text-slate-900 placeholder:text-slate-400",
              "transition-shadow duration-150",
              "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent",
              error
                ? "border-status-rejected focus:ring-status-rejected"
                : "border-slate-300",
              leftIcon ? "pl-10" : undefined,
              rightIcon ? "pr-10" : undefined,
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-status-rejected flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
