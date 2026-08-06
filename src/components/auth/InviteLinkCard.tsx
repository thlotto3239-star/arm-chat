'use client';

import { useState } from 'react';

/**
 * InviteLinkCard — personal invite link `arm.chat/u/<username>` with share
 * button per arm_chat_2:229-234. Falls back to clipboard when Web Share is
 * unavailable.
 */

export type InviteLinkCardProps = {
  href: string;
  label?: string;
};

export function InviteLinkCard({ href, label = 'ลิงก์เชิญเพื่อน' }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Arm Chat — เพิ่มฉันเป็นเพื่อน', url: href });
        return;
      } catch {
        /* share dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <div className="flex items-center justify-between bg-white border border-ink rounded-lg p-md">
        <span className="text-base text-primary underline truncate mr-md">{href}</span>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-xs text-ink hover:text-primary transition-colors"
          aria-label={copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์ลิงก์เชิญ'}
        >
          <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'share'}</span>
        </button>
      </div>
    </div>
  );
}

export default InviteLinkCard;
