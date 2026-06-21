import { Badge } from './Badge';

type EstadoInscripcion =
  | 'solicitada' | 'aprobada' | 'rechazada' | 'activa'
  | 'retirada' | 'aprobada_final' | 'reprobada_final' | 'cancelada';

interface BadgeEstadoInscripcionProps {
  estado: EstadoInscripcion;
  motivoRechazo?: string;
}

const LABELS: Record<EstadoInscripcion, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  activa: 'Activa',
  retirada: 'Retirada',
  aprobada_final: 'Aprobada',
  reprobada_final: 'Reprobada',
  cancelada: 'Cancelada',
};

const VARIANTS: Record<EstadoInscripcion, 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'muted'> = {
  solicitada: 'warning',
  aprobada: 'success',
  rechazada: 'destructive',
  activa: 'success',
  retirada: 'muted',
  aprobada_final: 'purple',
  reprobada_final: 'destructive',
  cancelada: 'muted',
};

export function BadgeEstadoInscripcion({ estado, motivoRechazo }: BadgeEstadoInscripcionProps) {
  return (
    <span title={motivoRechazo ?? LABELS[estado]}>
      <Badge variant={VARIANTS[estado]}>
        {LABELS[estado]}
      </Badge>
    </span>
  );
}
