import { Suspense } from "react";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}
