import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer group"
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            "mt-0.5 w-4 h-4 rounded border-slate-300",
            "text-brand-600 accent-brand-600",
            "focus:ring-2 focus:ring-brand-600 focus:ring-offset-1",
            "cursor-pointer flex-shrink-0",
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-400">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
