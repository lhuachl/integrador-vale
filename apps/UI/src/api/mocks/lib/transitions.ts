import type { EstadoInscripcion } from '../../types';

type Transicion = { from: EstadoInscripcion; to: EstadoInscripcion };

const TRANSICIONES: Transicion[] = [
  { from: 'solicitada', to: 'aprobada' },
  { from: 'solicitada', to: 'rechazada' },
  { from: 'aprobada', to: 'activa' },
  { from: 'activa', to: 'retirada' },
  { from: 'activa', to: 'aprobada_final' },
  { from: 'activa', to: 'reprobada_final' },
  { from: 'activa', to: 'cancelada' },
  { from: 'retirada', to: 'activa' },
  { from: 'rechazada', to: 'solicitada' },
];

const TERMINALES: ReadonlySet<EstadoInscripcion> = new Set([
  'aprobada_final',
  'reprobada_final',
  'cancelada',
]);

export function canTransition(from: EstadoInscripcion, to: EstadoInscripcion): boolean {
  if (from === to) return false;
  return TRANSICIONES.some((t) => t.from === from && t.to === to);
}

export function isTerminal(estado: EstadoInscripcion): boolean {
  return TERMINALES.has(estado);
}

export const TRANSICIONES_VALIDADAS = TRANSICIONES;
export const ESTADOS_TERMINALES = TERMINALES;