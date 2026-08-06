'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FlowPage() {
  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-12 text-left">
          <h1 className="text-4xl md:text-6xl font-normal text-ink mb-4">
            Arm Chat <br />
            <span className="text-primary">User Journey & System Architecture</span>
          </h1>
          <p className="text-lg text-ink-muted max-w-3xl leading-relaxed">
            แผนผังการทำงานและการเชื่อมต่อข้อมูลเชิงลึกของแอปพลิเคชันส่งข้อความสำหรับยุคใหม่ เน้นความเรียบง่าย ประสิทธิภาพ และความปลอดภัยสูงสุด
          </p>
        </div>

        {/* User Flow Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 relative">
          {/* Node 1: Landing Page */}
          <div className="md:col-span-4 bg-surface-white border border-ink p-6 rounded-tile node-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center mb-4 border border-ink">
                <span className="material-symbols-outlined text-[24px]">home</span>
              </div>
              <h3 className="text-2xl font-normal text-ink mb-2">1. Landing Page</h3>
              <p className="text-base text-ink-muted leading-relaxed">
                หน้าแรกที่ผู้ใช้พบเจอ นำเสนอคุณสมบัติหลัก ระบบความปลอดภัย และปุ่ม Call to Action เพื่อเริ่มต้นใช้งาน
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-primary font-normal">
              <Link href="/" className="hover:underline flex items-center gap-1">
                ไปที่ Landing Page →
              </Link>
            </div>
          </div>

          {/* Node 2: Authentication */}
          <div className="md:col-span-4 bg-surface-white border border-ink p-6 rounded-tile node-card">
            <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mb-4 border border-ink">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <h3 className="text-2xl font-normal text-ink mb-2">2. Authentication</h3>
            <p className="text-base text-ink-muted mb-4 leading-relaxed">
              ระบบสมัครสมาชิกและเข้าสู่ระบบผ่าน OTP หรือ Social Login เก็บข้อมูลด้วย Supabase Auth อย่างปลอดภัย
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container rounded-full text-xs border border-ink/10">Email OTP</span>
              <span className="px-3 py-1 bg-surface-container rounded-full text-xs border border-ink/10">Google</span>
              <span className="px-3 py-1 bg-surface-container rounded-full text-xs border border-ink/10">GitHub</span>
            </div>
          </div>

          {/* Node 3: Onboarding */}
          <div className="md:col-span-4 bg-surface-white border border-ink p-6 rounded-tile node-card">
            <div className="w-12 h-12 bg-tertiary-container rounded-full flex items-center justify-center mb-4 border border-ink">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </div>
            <h3 className="text-2xl font-normal text-ink mb-2">3. Onboarding</h3>
            <p className="text-base text-ink-muted leading-relaxed">
              ตั้งชื่อผู้ใช้ อัปโหลดรูปโปรไฟล์ และเลือกหัวข้อความสนใจเบื้องต้น เพื่อสร้างประสบการณ์ที่ตรงใจ
            </p>
          </div>

          {/* Node 4: Main Inbox Hub (Centerpiece) */}
          <div className="md:col-span-8 bg-ink text-surface-white p-8 rounded-tile node-card flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mb-4 border border-surface-white">
                <span className="material-symbols-outlined text-[24px] text-ink">inbox</span>
              </div>
              <h3 className="text-3xl font-normal mb-2 text-surface-white">4. Main Inbox Hub</h3>
              <p className="text-base opacity-80 mb-6 leading-relaxed">
                ศูนย์กลางการเชื่อมต่อที่รวม Chat, Call Log และ Group Management ไว้ในที่เดียว อัปเดตสถานะแบบ Real-time
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-surface-white/20 p-4 rounded-xl">
                  <div className="text-primary-fixed font-normal text-lg mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    รายการแชต
                  </div>
                  <div className="text-xs opacity-70">ข้อความเรียลไทม์</div>
                </div>
                <div className="border border-surface-white/20 p-4 rounded-xl">
                  <div className="text-primary-fixed font-normal text-lg mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    ประวัติการโทร
                  </div>
                  <div className="text-xs opacity-70">การโทร LiveKit</div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-64 h-48 bg-surface-dark rounded-xl p-4 flex flex-col justify-center items-center text-center border border-surface-white/20">
              <span className="text-primary-fixed font-normal text-sm mb-2">ศูนย์กลางข้อมูล Supabase</span>
              <div className="w-16 h-1 bg-primary-container rounded-full"></div>
            </div>
          </div>

          {/* Node 5: Chat & Call */}
          <div className="md:col-span-4 bg-secondary text-surface-white p-6 rounded-tile node-card">
            <div className="w-12 h-12 bg-surface-white rounded-full flex items-center justify-center mb-4 border border-ink">
              <span className="material-symbols-outlined text-[24px] text-ink">videocam</span>
            </div>
            <h3 className="text-2xl font-normal mb-2 text-surface-white">5. Chat & Call</h3>
            <p className="text-base opacity-90 mb-4 leading-relaxed">
              หน้าต่างสนทนาเชิงลึก รองรับการส่งไฟล์ และการโทรด้วยเสียง/วิดีโอคุณภาพสูงผ่าน LiveKit Cloud
            </p>
            <Link
              href="/call/demo-room"
              className="inline-flex items-center justify-center bg-primary-container text-ink px-6 py-2.5 rounded-full text-sm border border-ink hover:opacity-95 transition-all font-normal w-full"
            >
              ทดสอบการโทร LiveKit →
            </Link>
          </div>
        </section>

        {/* Adding Friends Architecture */}
        <section className="mb-16 bg-surface-container-low p-8 md:p-12 border border-ink rounded-tile">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-normal text-ink">การเพิ่มเพื่อน (Add Friends System)</h2>
              <p className="text-base text-ink-muted">ขั้นตอนการสร้างเครือข่ายความสัมพันธ์ที่ง่ายและรวดเร็ว</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-surface-white border border-ink rounded-full text-sm">QR Code</span>
              <span className="px-4 py-2 bg-surface-white border border-ink rounded-full text-sm">User ID</span>
              <span className="px-4 py-2 bg-surface-white border border-ink rounded-full text-sm">Invite Link</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-white p-6 rounded-2xl border border-ink/20">
              <h4 className="text-lg font-normal text-ink mb-2">1. ระบบ ID / Username</h4>
              <p className="text-sm text-ink-muted leading-relaxed">
                ค้นหาด้วยชื่อผู้ใช้ที่ไม่ซ้ำกัน (Unique Username) โดยระบบจะค้นหาในฐานข้อมูล Supabase แบบ Real-time
              </p>
            </div>
            <div className="bg-surface-white p-6 rounded-2xl border border-ink/20">
              <h4 className="text-lg font-normal text-ink mb-2">2. สแกน QR Code</h4>
              <p className="text-sm text-ink-muted leading-relaxed">
                สร้าง QR Code ส่วนตัวที่สามารถสแกนได้ทันที เหมาะสำหรับการเพิ่มเพื่อนในระยะใกล้
              </p>
            </div>
            <div className="bg-surface-white p-6 rounded-2xl border border-ink/20">
              <h4 className="text-lg font-normal text-ink mb-2">3. Invite Link</h4>
              <p className="text-sm text-ink-muted leading-relaxed">
                สร้างลิงก์เชิญพิเศษ ส่งผ่านแอปอื่น เมื่อคลิกจะเปิด Arm Chat และเพิ่มเพื่อนให้อัตโนมัติ
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
