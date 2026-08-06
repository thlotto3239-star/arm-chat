'use client';

import Link from 'next/link';
import { ArmChatLogo } from '@/components/brand';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 font-prompt text-ink">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <ArmChatLogo className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">ไม่พบหน้าที่คุณต้องการ</h2>
        <p className="text-ink-muted">
          หน้าเว็บที่คุณกำลังพยายามเข้าถึงไม่มีอยู่แล้ว หรืออาจถูกย้ายไปยังที่อื่น
        </p>
        <div>
          <Link
            href="/chats"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            กลับสู่หน้าหลักแชต
          </Link>
        </div>
      </div>
    </div>
  );
}
