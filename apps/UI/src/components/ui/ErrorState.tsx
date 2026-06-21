import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
      <AlertTriangle className="mb-4 size-10 text-destructive" />
      <h3 className="font-serif text-lg font-semibold text-destructive">Error</h3>
      <p className="mt-1 max-w-md font-sans text-sm text-destructive/80">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-destructive px-4 py-2 font-sans text-xs font-semibold text-destructive-foreground transition-all hover:brightness-110"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
