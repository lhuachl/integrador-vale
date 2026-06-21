import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-[var(--status-active-bg)] text-[var(--status-active-text)] border-[var(--status-active-border)]',
  warning: 'bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]',
  destructive: 'bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)] border-[var(--status-rejected-border)]',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
  purple: 'bg-[var(--status-approved-bg)] text-[var(--status-approved-text)] border-[var(--status-approved-border)]',
  muted: 'bg-[var(--status-muted-bg)] text-[var(--status-muted-text)] border-[var(--status-muted-border)]',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
