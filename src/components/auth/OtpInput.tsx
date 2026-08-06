'use client';

import { useRef } from 'react';
import { cn } from '@/shared/design-system';

/**
 * OtpInput — 6-digit verification boxes per arm_chat_1 verify step.
 *
 * Controlled: `value` is a string of digits (length ≤ `length`), `onChange`
 * receives the next string. Supports paste, auto-advance and backspace.
 */

export type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OtpInput({ length = 6, value, onChange, disabled, className }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = (i: number) => {
    refs.current[i]?.focus();
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    next[i] = digit;
    onChange(next.join(''));
    if (digit && i < length - 1) focusIndex(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) focusIndex(i - 1);
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) focusIndex(i - 1);
    if (e.key === 'ArrowRight' && i < length - 1) focusIndex(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits);
    focusIndex(Math.min(digits.length, length - 1));
  };

  return (
    <div className={cn('flex justify-center gap-lg', className)} role="group" aria-label="รหัสยืนยัน">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`ตัวเลขหลักที่ ${i + 1}`}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-14 border-2 border-ink rounded-lg text-center font-prompt text-2xl text-primary bg-surface-container-low',
            'focus:outline-none focus:ring-2 focus:ring-primary-container transition-all',
            value[i] ? 'bg-primary-container' : '',
            disabled && 'opacity-50 pointer-events-none',
          )}
        />
      ))}
    </div>
  );
}

export default OtpInput;
