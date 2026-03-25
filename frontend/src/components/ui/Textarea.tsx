import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, showCharCount, maxLength, className, id, value, ...props },
    ref,
  ) => {
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full px-4 py-3 rounded-lg border bg-white resize-none",
            "text-sm text-slate-900 placeholder:text-slate-400",
            "transition-shadow duration-150",
            "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent",
            error
              ? "border-status-rejected focus:ring-status-rejected"
              : "border-slate-300",
            className,
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-status-rejected flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          ) : (
            <span />
          )}
          {showCharCount && maxLength && (
            <span className="text-xs text-slate-400">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
