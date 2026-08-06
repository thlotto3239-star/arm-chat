import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge Tailwind classes safely (clsx + tailwind-merge).
 *
 * Use this within design-system components to allow host pages to override
 * primitive classes without conflict.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export default cn;