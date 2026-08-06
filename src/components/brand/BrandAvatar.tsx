import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/design-system';
import { ArmChatMark } from './ArmChatMark';

/**
 * BrandAvatar — fallback avatar built from the Arm Chat mark.
 *
 * Use when a user has no photo yet. Mirrors the design-system Avatar circular
 * shape (50% radius) with the brand mark as the identity placeholder.
 */

export type BrandAvatarProps = HTMLAttributes<HTMLSpanElement> & {
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
};

const sizeMap: Record<NonNullable<BrandAvatarProps['size']>, string> = {
  sm: 'w-8 h-8 p-1.5',
  md: 'w-10 h-10 p-2',
  lg: 'w-16 h-16 p-3',
};

export function BrandAvatar({ size = 'md', mono = false, className, ...rest }: BrandAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-ink bg-primary-container',
        sizeMap[size],
        className,
      )}
      {...rest}
    >
      <ArmChatMark mono={mono} className="w-full h-full" />
    </span>
  );
}

export default BrandAvatar;
