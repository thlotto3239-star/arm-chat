'use client';

import { Button } from '@/shared/design-system';

/**
 * OtpSimulator — "การจำลองการยืนยันภายใน" panel per arm_chat_1:199-206.
 *
 * Phase 9 internal OTP (no SMS provider): a demo button that fills the
 * current code into the OtpInput so testers can complete the flow.
 */

export type OtpSimulatorProps = {
  code: string;
  onFill: (code: string) => void;
  disabled?: boolean;
};

export function OtpSimulator({ code, onFill, disabled }: OtpSimulatorProps) {
  return (
    <div className="bg-surface-container-highest p-md rounded-xl space-y-sm">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-[20px] text-primary">security</span>
        <span className="text-xs text-ink">การจำลองการยืนยันภายใน</span>
      </div>
      <p className="text-[11px] text-ink-muted text-left">
        กดปุ่มเพื่อจำลองการรับรหัสจากอุปกรณ์เครื่องอื่น
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        disabled={disabled}
        iconName="smartphone"
        onClick={() => onFill(code)}
      >
        จำลองการใส่รหัส ({code})
      </Button>
    </div>
  );
}

export default OtpSimulator;
