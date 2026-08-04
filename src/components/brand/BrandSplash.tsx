import { cn } from '@/shared/design-system';
import { ArmChatCenterLogo } from './ArmChatMark';

/**
 * BrandSplash — full-surface splash (app boot / auth wall).
 *
 * Centered logo, per brand spec.
 * Use as a loading overlay or standalone <main>.
 */

export type BrandSplashProps = {
  message?: string;
  className?: string;
  markClassName?: string;
};

export function BrandSplash({ message, className, markClassName }: BrandSplashProps) {
  return (
    <div
      role="status"
      aria-label={message ?? 'กำลังโหลด Arm Chat'}
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-md bg-canvas font-sans',
        className,
      )}
    >
      <ArmChatCenterLogo className={cn('h-24 w-auto max-w-[240px] animate-pulse', markClassName)} />
      {message ? <p className="text-body-md text-ink-muted mt-2">{message}</p> : null}
    </div>
  );
}

export default BrandSplash;
