'use client';

import { ArmChatMark, ArmChatHeaderLogo } from '@/components/brand';
import { Icon } from '@/shared/design-system';

export function AuthBrandSide() {
  return (
    <div className="relative w-full h-full min-h-[600px] lg:min-h-screen bg-surface-dark text-surface-white overflow-hidden flex flex-col justify-between p-8 lg:p-12 xl:p-16">
      {/* Background Brand Image & Overlays */}
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLNjFUJpKnjbZVhOpk__E5sIeHW54r111s6kfnFp31Dnxz3XRIJYp0rSbrgQbOMyLlfKyypAyyl_I07w4eq2le0PLquiR93a73IB2BwS-9k09EEJWVtU2CbYTzMmOKYuqygtwCtujtSjSdAxyTQn-SvFT914uCClLIkZSZ72KJCOU6S3GIMcvVGSvN0u1IxLKcZdW9Bds-9cvDv7uDFWieAp12Vy7qpchNy2VhZhtXYemnvnkDoJk"
        alt="Arm Chat Experience"
        className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity scale-105 pointer-events-none"
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1E21] via-[#1C1E21]/75 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1C1E21]/90 via-transparent to-transparent pointer-events-none" />
      
      {/* Ambient Decorative Globs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/25 blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-secondary-container/20 blur-[100px] pointer-events-none" aria-hidden="true" />

      {/* Top Bar / Brand Badge */}
      <div className="relative z-10 flex items-center justify-between gap-md">
        <div className="flex items-center gap-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
          <ArmChatMark className="w-6 h-6" />
          <span className="text-xs font-medium tracking-wide text-white/90">Arm Chat Thailand</span>
        </div>

        <span className="inline-flex items-center gap-xs text-[11px] font-mono uppercase tracking-wider text-primary bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Live Hybrid Platform
        </span>
      </div>

      {/* Center Brand Highlights */}
      <div className="relative z-10 my-auto max-w-xl space-y-8 py-12">
        <div className="space-y-4">
          <ArmChatHeaderLogo className="h-10 w-auto opacity-90" />
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight text-white">
            เชื่อมต่อถึงกัน <br />
            <span className="text-primary">ด้วยความเรียบง่าย</span> และปลอดภัย
          </h1>
          <p className="text-base lg:text-lg text-white/80 leading-relaxed">
            สัมผัสประสบการณ์การสื่อสารยุคใหม่ รวมระบบส่งข้อความ Realtime, LiveKit HD Voice/Video Calls และการแจ้งเตือนแบบพุชในที่เดียว
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
              <Icon name="chat" className="text-[20px]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Realtime Messenger</h3>
              <p className="text-xs text-white/70">ส่งข้อความ สติ๊กเกอร์ รูปภาพ และไฟล์เอกสารได้ทันที ไม่สะดุด</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
              <Icon name="videocam" className="text-[20px]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">LiveKit HD Call & Screen Share</h3>
              <p className="text-xs text-white/70">สนทนาด้วยเสียงและวิดีโอคุณภาพสูง คมชัด ปรับคุณภาพอัตโนมัติ</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
              <Icon name="security" className="text-[20px]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">High Security & Privacy</h3>
              <p className="text-xs text-white/70">การยืนยันตัวตนระดับสูง ป้องกันข้อมูลรั่วไหลอย่างมั่นใจ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer / Testimonial */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
        <p className="flex items-center gap-2">
          <Icon name="verified" className="text-primary text-[16px]" fill={1} />
          <span>ระบบผ่านการทดสอบ Production Readiness Matrix 143+ รายการ</span>
        </p>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>v1.0.0</span>
          <span>•</span>
          <span>Supabase Auth</span>
          <span>•</span>
          <span>LiveKit Cloud</span>
        </div>
      </div>
    </div>
  );
}

export default AuthBrandSide;
