import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  valor: string | number;
  icon?: ReactNode;
}

export function StatCard({ label, valor, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 card-neumorf">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-foreground">{valor}</p>
    </div>
  );
}
