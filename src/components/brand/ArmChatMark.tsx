import type { ImgHTMLAttributes } from 'react';

/**
 * Arm Chat official brand assets (local — ห้าม hot-link โลโก้จาก host ภายนอก)
 */
export const APP_ICON_URL = '/brand/app-icon.png';
export const CENTER_LOGO_URL = '/brand/logo-center.png';
export const HEADER_LOGO_URL = '/brand/header.png';

export type ArmChatMarkProps = ImgHTMLAttributes<HTMLImageElement> & {
  mono?: boolean;
};

export function ArmChatMark({ mono = false, className, alt = 'Arm Chat Icon', ...rest }: ArmChatMarkProps) {
  return (
    <img
      src={APP_ICON_URL}
      alt={alt}
      className={`rounded-full object-cover shrink-0 ${mono ? 'grayscale opacity-90' : ''} ${className || ''}`}
      {...rest}
    />
  );
}

export function ArmChatCenterLogo({ className, alt = 'Arm Chat Center Logo', ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={CENTER_LOGO_URL}
      alt={alt}
      className={`object-contain shrink-0 ${className || ''}`}
      {...rest}
    />
  );
}

export function ArmChatHeaderLogo({ className, alt = 'Arm Chat Header Logo', ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={HEADER_LOGO_URL}
      alt={alt}
      className={`object-contain shrink-0 ${className || ''}`}
      {...rest}
    />
  );
}

export default ArmChatMark;

