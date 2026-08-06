'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArmChatLogo } from '@/components/brand';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 font-prompt text-ink">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <ArmChatLogo className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold text-destructive">เกิดข้อผิดพลาด</h1>
        <p className="text-ink-muted">
          ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            ลองใหม่อีกครั้ง
          </button>
          <Link
            href="/chats"
            className="px-6 py-3 border border-ink/20 text-base font-medium rounded-xl text-ink bg-surface-white hover:bg-surface-container transition-colors shadow-sm"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
