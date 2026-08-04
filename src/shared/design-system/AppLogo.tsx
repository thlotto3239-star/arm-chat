import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * AppLogo — the single source of truth for Arm Chat branding.
 *
 * Rules (per ARCHITECTURE_GUARD.md + Phase 4/5 spec):
 * - Always circular (border-radius 50% per design system rule)
 * - Never import logo image directly in pages — always use <AppLogo />
 * - Single visual identity across login, onboarding, sidebar, profile, settings,
 *   empty states, loading screens, error pages
 *
 * Variants:
 * - full: green circle + "Arm Chat" wordmark to the right
 * - mark: just the circular emblem (for avatars / favicons / splash)
 * - mono-white: emblem for dark surfaces (call page, danger zone)
 */

export type AppLogoProps = {
  variant?: 'full' | 'mark' | 'mono-white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: ReactNode;
};

const sizeMap: Record<NonNullable<AppLogoProps['size']>, { mark: string; text: string }> = {
  sm: { mark: 'w-8 h-8', text: 'text-body-md' },
  md: { mark: 'w-12 h-12', text: 'text-body-lg' },
  lg: { mark: 'w-20 h-20', text: 'text-display-md' },
  xl: { mark: 'w-28 h-28', text: 'text-display-lg' },
};

function Emblem({
  variant,
  sizeClass,
}: {
  variant: AppLogoProps['variant'];
  sizeClass: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-ink',
        sizeClass,
        variant === 'mono-white'
          ? 'bg-surface-dark text-surface-white'
          : 'bg-primary-container text-ink',
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="w-3/5 h-3/5"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="32" cy="32" r="30" fill={variant === 'mono-white' ? 'none' : '#25d366'} stroke="currentColor" strokeWidth={2} />
        <path
          d="M28 16H40A8 8 0 0 1 48 24V36A8 8 0 0 1 40 44H32L24 52V44H20A8 8 0 0 1 12 36V24A8 8 0 0 1 20 16Z"
          fill={variant === 'mono-white' ? 'none' : '#ffffff'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M34 19L27.5 39" />
        <path d="M34 19L40.5 39" />
        <path d="M29 32H39" />
      </svg>
    </span>
  );
}

export function AppLogo({ variant = 'full', size = 'md', className, children }: AppLogoProps) {
  const sz = sizeMap[size];

  if (variant === 'mark') {
    return <Emblem variant={variant} sizeClass={sz.mark} />;
  }

  return (
    <div className={cn('inline-flex items-center gap-md', className)}>
      <Emblem variant={variant} sizeClass={sz.mark} />
      <span
        className={cn(
          'font-prompt font-normal text-ink leading-none',
          sz.text,
          variant === 'mono-white' && 'text-surface-white',
        )}
      >
        Arm Chat
      </span>
      {children ? <span className="ml-xs font-prompt text-ink-muted text-label-sm">{children}</span> : null}
    </div>
  );
}

export default AppLogo;