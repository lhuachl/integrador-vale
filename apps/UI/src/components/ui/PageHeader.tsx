import type { ReactNode } from 'react';

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  titleClassName?: string;
}

export function PageHeader({ titulo, descripcion, acciones, titleClassName }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className={`font-serif text-3xl font-bold text-foreground ${titleClassName ?? ''}`}>{titulo}</h1>
        {descripcion && <p className="mt-1 font-sans text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="shrink-0">{acciones}</div>}
    </div>
  );
}
