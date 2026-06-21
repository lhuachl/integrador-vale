import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  mensaje?: string;
}

export function LoadingState({ mensaje = 'Cargando…' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="font-sans text-sm">{mensaje}</span>
    </div>
  );
}
