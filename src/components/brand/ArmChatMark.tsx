import type { ImgHTMLAttributes } from 'react';

/**
 * Arm Chat official brand asset URLs
 */
export const APP_ICON_URL = 'https://img1.pic.in.th/images/c2db5de63c52f3f384bef058630d00a2.png';
export const CENTER_LOGO_URL = 'https://img2.pic.in.th/-5234c8b5903d4694.png';
export const HEADER_LOGO_URL = 'https://img1.pic.in.th/images/dcc2c4467a42cf230657f36250989360.png';

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

