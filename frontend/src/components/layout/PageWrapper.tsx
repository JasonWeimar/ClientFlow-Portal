import { cn } from "../../lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "narrow" | "wide";
}

const maxWidthClasses = {
  narrow: "max-w-2xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
};

export function PageWrapper({
  children,
  className,
  maxWidth = "default",
}: PageWrapperProps) {
  return (
    <main className={cn("min-h-screen bg-slate-50", className)}>
      <div className={cn("mx-auto px-20 py-8", maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </main>
  );
}
