/**
 * Arm Chat Brand components.
 *
 * Single source of truth for the brand identity in React:
 *   ArmChatMark       — circular mark (SVG)
 *   ArmChatWordmark   — "Arm Chat" logotype
 *   ArmChatLogo       — lockup (horizontal / stacked / mark)
 *   BrandSplash       — full-surface boot screen
 *   BrandAvatar       — mark-based avatar fallback
 *
 * Static assets live in public/brand/*.svg (favicon, manifest, OG).
 */

export {
  ArmChatMark,
  ArmChatCenterLogo,
  ArmChatHeaderLogo,
  APP_ICON_URL,
  CENTER_LOGO_URL,
  HEADER_LOGO_URL,
  type ArmChatMarkProps,
} from './ArmChatMark';
export { ArmChatWordmark, type ArmChatWordmarkProps } from './ArmChatWordmark';
export { ArmChatLogo, type ArmChatLogoProps } from './ArmChatLogo';
export { BrandSplash, type BrandSplashProps } from './BrandSplash';
export { BrandAvatar, type BrandAvatarProps } from './BrandAvatar';
