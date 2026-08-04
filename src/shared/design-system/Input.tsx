import clsx from 'clsx';
import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Input — 50px pill-shaped text input per Design System.
 *
 * Style: bg-surface-white, 1px ink border, rounded-full, ink text,
 * placeholder ink-muted.
 *
 * Slot props:
 * - startAddon: prefix slot (e.g. "+66" or leading icon)
 * - endAddon:   suffix slot (e.g. trailing icon button or status)
 *
 * Accessibility: must always pair with a sibling <label>via htmlFor in the host page.
 */

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'rounded-tile';
  hasError?: boolean;
  startAddon?: ReactNode;
  endAddon?: ReactNode;
};

const sizeClasses: Record<NonNullable<InputProps['inputSize']>, string> = {
  sm: 'h-[44px] px-md text-body-md',
  md: 'h-[54px] px-md text-body-md',
  lg: 'h-[64px] px-lg text-body-lg',
};

export function Input({
  inputSize = 'md',
  variant = 'pill',
  hasError = false,
  startAddon,
  endAddon,
  className,
  ...rest
}: InputProps) {
  const radius = variant === 'pill' ? 'rounded-full' : 'rounded-[25px]';
  const borderColor = hasError ? 'border-error' : 'border-ink';
  return (
    <div className={clsx('relative flex items-center w-full', className)}>
      {startAddon ? (
        <span className="absolute left-md z-10 inline-flex items-center justify-center text-ink">
          {startAddon}
        </span>
      ) : null}
      <input
        {...rest}
        className={clsx(
          'w-full bg-surface-white border text-ink placeholder:text-ink-muted',
          radius,
          borderColor,
          'focus:ring-2 focus:ring-primary-container focus:outline-none transition-all',
          sizeClasses[inputSize],
          startAddon && 'pl-[64px]',
          endAddon && 'pr-[64px]',
        )}
      />
      {endAddon ? (
        <span className="absolute right-md z-10 inline-flex items-center justify-center text-ink">
          {endAddon}
        </span>
      ) : null}
    </div>
  );
}

export default Input;