interface PlaceholderProps {
  titulo: string;
  descripcion: string;
}

export function PlaceholderPage({ titulo, descripcion }: PlaceholderProps) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl font-bold text-foreground">{titulo}</h1>
      <p className="mt-3 font-sans text-sm text-muted-foreground">{descripcion}</p>
      <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
        <p className="font-sans text-sm text-muted-foreground">
          Esta pantalla se implementa en la Fase 4.
        </p>
      </div>
    </div>
  );
}
