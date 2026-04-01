import { forwardRef } from "react";
import { Spinner } from "./Spinner";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: React.ElementType; // allows: as={Link}, as="a", etc.
  to?: string; // passed through to React Router's Link
}

const variantClasses = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-brand-600 hover:bg-brand-50",
  danger:
    "bg-status-rejected-bg text-status-rejected border border-status-rejected hover:bg-red-100",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      as: Component = "button", // default is still a plain button
      variant = "primary",
      size = "md",
      isLoading,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        disabled={Component === "button" ? disabled || isLoading : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </Component>
    );
  },
);
Button.displayName = "Button";
