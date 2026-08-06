import Link from 'next/link';
import { ArmChatLogo } from '@/components/brand';

export default function Footer() {
  return (
    <footer className="bg-canvas border-t border-ink/10 pt-16 pb-12 px-6 md:px-16 text-ink">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="md:col-span-1">
          <ArmChatLogo layout="horizontal" size="sm" className="mb-4" />
          <p className="font-prompt text-sm text-ink-muted leading-relaxed mb-6">
            แอปพลิเคชันส่งข้อความความเร็วสูงที่เน้นความเป็นส่วนตัว ปลอดภัยด้วยระบบเข้ารหัสข้อมูลระดับสากล
          </p>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-primary-container animate-ping inline-block"></span>
            <span className="font-prompt text-xs text-ink-muted">ระบบส่งข้อความ & วิดีโอคอลพร้อมใช้งาน</span>
          </div>
        </div>

        <div>
          <h4 className="font-prompt text-base font-normal text-ink mb-4">คุณสมบัติเด่น</h4>
          <ul className="space-y-2.5 font-prompt text-sm text-ink-muted">
            <li><Link href="/#about" className="hover:text-ink transition-colors">ข้อความแบบเรียลไทม์</Link></li>
            <li><Link href="/#features" className="hover:text-ink transition-colors">โทรเสียง & วิดีโอคอล HD</Link></li>
            <li><Link href="/#features" className="hover:text-ink transition-colors">เรื่องราวประจำวัน (Stories)</Link></li>
            <li><Link href="/#features" className="hover:text-ink transition-colors">สแกนเพิ่มเพื่อนด้วย QR Code</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-prompt text-base font-normal text-ink mb-4">สถาปัตยกรรมระบบ</h4>
          <ul className="space-y-2.5 font-prompt text-sm text-ink-muted">
            <li><span className="hover:text-ink transition-colors cursor-default">โครงสร้างระบบความเร็วสูง</span></li>
            <li><span className="hover:text-ink transition-colors cursor-default">ฐานข้อมูลเรียลไทม์</span></li>
            <li><span className="hover:text-ink transition-colors cursor-default">ระบบวิดีโอคอลความคมชัดสูง</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-prompt text-base font-normal text-ink mb-4">ความปลอดภัย & นโยบาย</h4>
          <ul className="space-y-2.5 font-prompt text-sm text-ink-muted">
            <li><span>End-to-End Encryption</span></li>
            <li><span>นโยบายความเป็นส่วนตัว</span></li>
            <li><span>เงื่อนไขการให้บริการ</span></li>
            <li><span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full border border-ink inline-block font-normal">Arm Chat Design System</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-ink/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-prompt text-xs text-ink-muted">
          © {new Date().getFullYear()} Arm Chat. All rights reserved.
        </p>
        <div className="flex gap-4 font-prompt text-xs text-ink-muted">
          <span>arm-chat.vercel.app</span>
        </div>
      </div>
    </footer>
  );
}
