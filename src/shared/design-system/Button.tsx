import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Button — Pill-shaped action per Design System.
 *
 * Variants:
 * - primary:   bg-primary-container, ink text, ink border
 * - secondary: transparent bg, ink text, ink border
 * - danger:    bg-error, on-error text, no border
 * - ghost:     transparent bg, ink text, no border (for icon-only use)
 *
 * Shape: 50px pill (border-radius full per DESIGN.md)
 * Hover: bg-surface-container (secondary) / opacity 90% (primary)
 *
 * Sizes:
 * - sm: h-[44px] px-md text-button-md
 * - md: h-[54px] px-lg text-button-md  (default, matches design's 54px auth CTAs)
 * - lg: h-[64px] px-xl text-body-lg
 *
 * iconOnly=true renders a square 48px / 56px button.
 *
 * Per DESIGN.md: pill (50px) for all interactive elements. 1px ink border.
 */

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  iconName?: string;
  iconFill?: 0 | 1;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-container text-ink border border-ink hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-transparent text-ink border border-ink hover:bg-surface-container active:scale-[0.98]',
  danger: 'bg-error text-on-error border-0 hover:opacity-90 active:scale-[0.98]',
  ghost: 'bg-transparent text-ink border-0 hover:bg-surface-container active:scale-[0.98]',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, { wrap: string; icon: string }> = {
  sm: { wrap: 'h-[44px] px-md text-button-md', icon: 'w-[44px] h-[44px]' },
  md: { wrap: 'h-[54px] px-lg text-button-md', icon: 'w-[54px] h-[54px]' },
  lg: { wrap: 'h-[64px] px-xl text-body-lg', icon: 'w-[64px] h-[64px]' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  iconName,
  iconFill,
  loading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-md rounded-full font-prompt font-normal transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        iconOnly ? sizeClasses[size].icon : sizeClasses[size].wrap,
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="progress_activity" className="animate-spin" />
      ) : iconName ? (
        <Icon name={iconName} fill={iconFill} />
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
    </button>
  );
}

export default Button;