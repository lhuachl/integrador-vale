import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}

export function EmptyState({ icon, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center card-neumorf">
      <div className="mb-4 text-muted-foreground">
        {icon ?? <Inbox className="size-10" />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-foreground">{titulo}</h3>
      <p className="mt-1 font-sans text-sm text-muted-foreground">{descripcion}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
