import { cn } from "../../lib/utils";

interface PageWrapperProps {
  title?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "narrow" | "default" | "wide";
}

const maxWidthClasses = {
  narrow: "max-w-2xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
};

export function PageWrapper({
  title,
  action,
  back,
  children,
  className,
  maxWidth = "default",
}: PageWrapperProps) {
  return (
    <main className={cn("min-h-screen bg-slate-50", className)}>
      <div className={cn("mx-auto px-20 py-8", maxWidthClasses[maxWidth])}>
        {/* Back button — renders above the title if provided */}
        {back && <div className="mb-4">{back}</div>}

        {/* Page header — title on the left, action button on the right */}
        {(title || action) && (
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            )}
            {action && <div>{action}</div>}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}
