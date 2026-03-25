import { Card } from "../../components/ui/Card";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          {/* Form content */}
          {children}
        </div>
      </Card>
    </div>
  );
}
