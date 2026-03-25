import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  accentColor?: string; // Tailwind border color class e.g. 'border-status-pending'
}

export function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        accentColor && `border-l-4 ${accentColor}`,
      )}
    >
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </Card>
  );
}

// Usage:
// <StatCard label='Pending Review' value={8} accentColor='border-status-pending' />
