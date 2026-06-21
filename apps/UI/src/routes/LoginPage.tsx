import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, GraduationCap, Lock, Mail, Shield, User, Users } from 'lucide-react';
import Hyperspeed from '@/components/Hyperspeed';
import BorderGlow from '@/components/BorderGlow';
import { Button } from '@/components/ui/button';
import { api } from '@/api/client';
import { LoginInputSchema, type LoginInputParsed } from '@/api/schemas';
import type { Rol } from '@/api/types';

const ROLE_HOME: Record<Rol, string> = {
  estudiante: '/estudiante/cursos',
  docente: '/docente/grupos',
  coordinador: '/coordinador/grupos',
  administrativo: '/administrativo/usuarios',
};

const QUICK_LOGINS: { email: string; password: string; label: string; icon: typeof User }[] = [
  { email: 'ana@uni.edu', password: 'estudiante123', label: 'Estudiante', icon: User },
  { email: 'dario@uni.edu', password: 'docente123', label: 'Docente', icon: BookOpen },
  { email: 'carlos@uni.edu', password: 'coord123', label: 'Coordinador', icon: Shield },
  { email: 'lucia@uni.edu', password: 'admin123', label: 'Administrativo', icon: Users },
];

const TUNNEL_OKLCH = {
  roadColor: 0x050200,
  islandColor: 0x030100,
  background: 0x000000,
  shoulderLines: 0x782010,
  brokenLines: 0x5c1808,
  leftCars: [0x7c2010, 0x8c2808, 0x962c08],
  rightCars: [0x9a2c18, 0x8a2410, 0x7c2010],
  sticks: 0x8a2810,
};

const GLOW_BG = '#0c0905';
const GLOW_COLOR = '15 75 44';
const GRADIENT_COLORS = [
  'hsl(15 75% 44%)',
  'hsl(43 90% 59%)',
  'hsl(26 59% 36%)',
];

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInputParsed>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: '', password: '' },
  });

  const { data: meResult } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (input: LoginInputParsed) => api.auth.login(input) as Promise<any>,
    onSuccess: (response: any) => {
      queryClient.setQueryData(['auth', 'me'], response);
      navigate(ROLE_HOME[response.data.rol as Rol], { replace: true });
    },
    onError: (err: any) => {
      setServerError(err?.message || err?.response?.data?.error?.message || 'No se pudo iniciar sesión');
    },
  });

  if (meResult) {
    return <Navigate to={ROLE_HOME[meResult.data.rol as Rol]} replace />;
  }

  function onSubmit(values: LoginInputParsed) {
    setServerError(null);
    mutation.mutate(values);
  }

  function quickLogin(email: string, password: string) {
    setServerError(null);
    setValue('email', email);
    setValue('password', password);
    mutation.mutate({ email, password });
  }

  const isPending = mutation.isPending;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Hyperspeed
          effectOptions={{
            length: 400,
            speedUp: 2,
            fov: 80,
            fovSpeedUp: 130,
            colors: TUNNEL_OKLCH,
            lightPairsPerRoadWay: 60,
            totalSideLightSticks: 20,
            carLightsRadius: [0.04, 0.09],
            carLightsLength: [8, 50],
            lightStickWidth: [0.06, 0.2],
            lightStickHeight: [0.7, 1.2],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -150],
          }}
        />
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-black/80 via-black/50 to-black/90" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <BorderGlow
          backgroundColor={GLOW_BG}
          glowColor={GLOW_COLOR}
          borderRadius={24}
          glowRadius={60}
          glowIntensity={1.3}
          coneSpread={20}
          animated={true}
          colors={GRADIENT_COLORS}
          className="w-full max-w-sm"
        >
          <div className="border-glow-inner px-8 py-9">
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <GraduationCap className="size-6 text-primary" />
              </div>
                <h1 className="font-serif text-4xl font-bold tracking-tight text-primary drop-shadow-[0_0_24px_oklch(0.4650_0.1470_24.9381_/_0.5)]">
                Avior SIU
              </h1>
              <p className="mt-2 font-sans text-sm text-secondary-foreground">
                Sistema Integrado Universitario
              </p>
            </div>

            <div className="mb-5 border-b border-white/10" />

            <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-widest text-secondary-foreground">
              Iniciar sesión
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="font-sans text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                  Correo electrónico
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className="peer block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3.5 font-sans text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-sm transition-all focus:border-primary/60 focus:bg-white/10 focus:ring-2 focus:ring-primary/30"
                    placeholder="usuario@universidad.edu"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="font-sans text-xs font-medium uppercase tracking-wider text-secondary-foreground">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="font-sans text-xs text-white/40 transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className="peer block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 font-sans text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-sm transition-all focus:border-primary/60 focus:bg-white/10 focus:ring-2 focus:ring-primary/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {serverError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 font-sans text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full rounded-lg bg-primary py-2.5 font-sans text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_oklch(0.4650_0.1470_24.9381_/_0.3)] transition-all hover:brightness-110 hover:shadow-[0_4px_28px_oklch(0.4650_0.1470_24.9381_/_0.5)] active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Ingresando…
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </div>
        </BorderGlow>

        <div className="w-full max-w-sm">
          <p className="mb-3 text-center font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">
            Acceso rápido — entorno de pruebas
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LOGINS.map(({ email, password, label, icon: Icon }) => (
              <button
                key={email}
                type="button"
                onClick={() => quickLogin(email, password)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 font-sans text-xs text-white/70 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-white/10 hover:text-primary active:scale-[0.98] disabled:opacity-40"
              >
                <Icon className="size-3 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
