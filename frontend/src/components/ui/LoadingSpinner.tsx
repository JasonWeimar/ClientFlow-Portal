import { Spinner } from "./Spinner";

interface LoadingSpinnerProps {
  fullscreen?: boolean;
}

export function LoadingSpinner({ fullscreen = false }: LoadingSpinnerProps) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
