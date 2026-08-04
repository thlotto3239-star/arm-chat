'use client';

import { useState } from 'react';

/**
 * UniqueIdCard — auto-generated `ARM-XXXX-TH` user ID with copy button
 * per arm_chat_2:222-227.
 */

export type UniqueIdCardProps = {
  uid: string;
};

export function UniqueIdCard({ uid }: UniqueIdCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      <span className="text-[11px] text-ink-muted">User ID อัตโนมัติ</span>
      <div className="flex items-center justify-between bg-white border border-ink rounded-lg p-md">
        <span className="font-mono tracking-wider text-base text-ink">{uid}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-xs text-ink hover:text-primary transition-colors"
          aria-label={copied ? 'คัดลอกแล้ว' : 'คัดลอก User ID'}
        >
          <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
        </button>
      </div>
    </div>
  );
}

export default UniqueIdCard;
