/**
 * Design System barrel export.
 *
 * Import all primitives from here:
 *   import { Button, Input, Avatar, AppLogo, Icon } from "@/shared/design-system";
 *
 * Pages MUST NOT create their own Button / Card / Modal / Input — use these only.
 */

export { AppLogo, type AppLogoProps } from './AppLogo';
export { Avatar, type AvatarProps } from './Avatar';
export { Button, type ButtonProps } from './Button';
export { Icon, type IconProps } from './Icon';
export { Input, type InputProps } from './Input';
export { cn } from './cn';