import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full h-12 px-4 rounded-lg border bg-white",
            "text-sm text-slate-900",
            "transition-shadow duration-150 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent",
            "appearance-none",
            error
              ? "border-status-rejected focus:ring-status-rejected"
              : "border-slate-300",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-status-rejected flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
