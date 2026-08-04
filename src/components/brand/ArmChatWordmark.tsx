import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/design-system';

/**
 * ArmChatWordmark — the "Arm Chat" logotype.
 *
 * Per brand: Inter/Prompt 500, ink #1c1e21. weight 400-500 only (no heavy bold).
 * Use <ArmChatLogo /> for mark + wordmark combined.
 */

export type ArmChatWordmarkProps = HTMLAttributes<HTMLSpanElement>;

export function ArmChatWordmark({ className, ...rest }: ArmChatWordmarkProps) {
  return (
    <span
      className={cn('font-sans font-medium tracking-tight text-ink leading-none select-none', className)}
      {...rest}
    >
      Arm Chat
    </span>
  );
}

export default ArmChatWordmark;
