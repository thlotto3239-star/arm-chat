import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/design-system';
import { ArmChatMark } from './ArmChatMark';
import { ArmChatWordmark } from './ArmChatWordmark';

/**
 * ArmChatLogo — brand lockup: circular mark + wordmark.
 *
 * Single source of truth for the Arm Chat logo. Always circular (never a
 * square container). Official colors only: #25d366 / #1c1e21 / #ffffff.
 *
 * Variants (spec):
 * - mark:        mark only (avatars, favicons, splash)
 * - horizontal:  mark left, wordmark right (Navbar, Footer)
 * - stacked:     mark on top, wordmark below (Login, Splash)
 * - monochrome:  single-color mark using currentColor (dark surfaces)
 *
 * API:
 *   <ArmChatLogo />                      // default: horizontal, 40px
 *   <ArmChatLogo size={48} />
 *   <ArmChatLogo size={64} variant="horizontal" />
 *   <ArmChatLogo size={40} variant="mark" />
 *   <ArmChatLogo size={48} variant="monochrome" className="text-surface-white" />
 *
 * Backward-compatible aliases (kept for existing call sites):
 *   layout="horizontal" | "stacked" | "mark"   → variant
 *   size="sm" | "md" | "lg"                     → pixel preset
 *   mono                                           → monochrome
 */

export type ArmChatLogoProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'mark' | 'horizontal' | 'stacked' | 'monochrome';
  /** @deprecated use `variant` */
  layout?: 'mark' | 'horizontal' | 'stacked';
  size?: number | 'sm' | 'md' | 'lg';
  /** @deprecated use `variant="monochrome"` */
  mono?: boolean;
  markClassName?: string;
};

const sizePresets: Record<'sm' | 'md' | 'lg', number> = { sm: 32, md: 40, lg: 64 };

const wordPresets: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function ArmChatLogo({
  variant,
  layout,
  size = 'md',
  mono = false,
  className,
  markClassName,
  ...rest
}: ArmChatLogoProps) {
  const resolvedVariant =
    variant ?? (mono ? 'monochrome' : layout ?? 'horizontal');

  const isMonochrome = resolvedVariant === 'monochrome';

  const px =
    typeof size === 'number' ? size : sizePresets[size] ?? sizePresets.md;

  const mark = (
    <ArmChatMark
      mono={isMonochrome || mono}
      className={cn('shrink-0', markClassName)}
      style={{ width: px, height: px }}
    />
  );

  if (resolvedVariant === 'mark' || isMonochrome) {
    return (
      <div className={cn('inline-flex shrink-0', className)} {...rest}>
        {mark}
      </div>
    );
  }

  const wordClass =
    typeof size === 'number'
      ? { fontSize: Math.max(14, px / 2), lineHeight: 1 }
      : (wordPresets[size] ?? wordPresets.md);

  if (resolvedVariant === 'stacked') {
    return (
      <div className={cn('inline-flex flex-col items-center gap-sm', className)} {...rest}>
        {mark}
        <ArmChatWordmark className={typeof wordClass === 'string' ? wordClass : undefined} style={typeof wordClass === 'string' ? undefined : wordClass} />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-md', className)} {...rest}>
      {mark}
      <ArmChatWordmark className={typeof wordClass === 'string' ? wordClass : undefined} style={typeof wordClass === 'string' ? undefined : wordClass} />
    </div>
  );
}

export default ArmChatLogo;
