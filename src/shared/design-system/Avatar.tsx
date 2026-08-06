import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { AppLogo } from './AppLogo';

/**
 * Avatar — circular avatar (per DESIGN.md: 50% radius reserved for avatars + badges)
 *
 * Slot:
 * - src: image URL — when provided, renders cropped circle
 * - alt: accessible name
 * - name: when no src, renders initials fallback
 * - size: sm/md/lg/xl
 * - status: 'online' | 'offline' | 'busy' | 'away' | null
 *
 * Default fallback: AppLogo mark (per Phase 5 + Profile Avatar Rule — "All profile images: must use circular avatar component; default use AppLogo fallback")
 */

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  ring?: boolean;
};

const sizeMap: Record<NonNullable<AvatarProps['size']>, { box: string; text: string; dot: string }> = {
  sm: { box: 'w-8 h-8', text: 'text-label-sm', dot: 'w-2 h-2' },
  md: { box: 'w-12 h-12', text: 'text-body-md', dot: 'w-3 h-3' },
  lg: { box: 'w-20 h-20', text: 'text-body-lg', dot: 'w-3.5 h-3.5' },
  xl: { box: 'w-28 h-28', text: 'text-display-md', dot: 'w-4 h-4' },
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] ?? '').toUpperCase()).join('');
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status = null,
  ring = false,
  className,
  ...rest
}: AvatarProps) {
  const sz = sizeMap[size];
  const statusColor =
    status === 'online'
      ? 'bg-primary-container'
      : status === 'busy'
        ? 'bg-error'
        : status === 'away'
          ? 'bg-tertiary'
          : 'bg-surface-variant';
  return (
    <span
      className={clsx('relative inline-flex shrink-0', sz.box, className)}
      {...rest}
    >
      <span
        className={clsx(
          'inline-flex items-center justify-center overflow-hidden rounded-full border border-ink bg-surface-container-low font-prompt font-normal text-ink',
          sz.box,
          ring && 'ring-2 ring-primary-container ring-offset-2 ring-offset-background',
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? name ?? 'avatar'}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : name ? (
          <span className={clsx('font-normal', sz.text)}>{initialsFromName(name) || <AppLogo variant="mark" size="sm" />}</span>
        ) : (
          <AppLogo variant="mark" size="sm" />
        )}
      </span>
      {status ? (
        <span
          className={clsx(
            'absolute -bottom-xs -right-xs inline-block rounded-full border-2 border-background',
            sz.dot,
            statusColor,
          )}
          aria-label={`presence-${status}`}
        />
      ) : null}
    </span>
  );
}

export default Avatar;