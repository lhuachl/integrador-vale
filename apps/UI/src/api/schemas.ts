import { z } from 'zod';

export const RolSchema = z.enum(['estudiante', 'docente', 'administrativo', 'coordinador']);

export const EstadoInscripcionSchema = z.enum([
  'solicitada',
  'aprobada',
  'rechazada',
  'activa',
  'retirada',
  'aprobada_final',
  'reprobada_final',
  'cancelada',
]);

export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().email(),
  rol: RolSchema,
  programaIds: z.array(z.string()),
  activo: z.boolean(),
});

export const LoginInputSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInputParsed = z.infer<typeof LoginInputSchema>;

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});