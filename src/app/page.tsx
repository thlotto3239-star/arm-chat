import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Arm Chat - Feature-Rich Utility',
  description:
    'เชื่อมต่อทุกความรู้สึก ด้วยประสิทธิภาพสูงสุด — ยกระดับการสื่อสารของคุณด้วยเครื่องมือที่ทรงพลัง รวดเร็ว และปลอดภัย',
};

const navLinks = [
  { label: 'ฟีเจอร์การใช้งาน', href: '#features' },
  { label: 'ความปลอดภัยและการเข้ารหัส', href: '#security' },
  { label: 'สำหรับองค์กร', href: '#enterprise' },
];

const features = [
  {
    icon: 'chat',
    title: 'Private Messaging',
    desc: 'ระบบส่งข้อความที่รวดเร็วและแม่นยำ รองรับการแชร์ไฟล์ทุกนามสกุล ขนาดสูงสุดถึง 2GB พร้อมระบบซิงค์ข้อมูลข้ามแพลตฟอร์มแบบไร้รอยต่อ ให้คุณไม่พลาดทุกการติดต่อสำคัญ',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCu0A2s-ZD82Zm019FdwxRAS5tbruqmRJPt8VkjtKX0TtFioT-yIwyL0686bzxUfP-3yyA8B6Z9LHsg88WA1s9-C6zHxTE8sSuxA6uZ382dFF8JMNzjs1k8YewYqMNoMKH7IzvUTDq8f9ggwl8YfoZUjUfCK1h_lWPqIeFGNYaa7v9TBoLrY9gv0B4KAGXnRWKLGXEB8kia9qh58g2zX1CJO4yo1DA9rUoV5gOeI91Y44gxHoXpEcs',
    bgClass: 'bg-background',
    imgOpacity: 'opacity-80',
  },
  {
    icon: 'videocam',
    title: 'HD Video/Voice Calls',
    desc: 'สัมผัสคุณภาพภาพและเสียงระดับความคมชัดสูงสุด (Ultra HD) พร้อมเทคโนโลยี AI ตัดเสียงรบกวนอัจฉริยะ ปรับคุณภาพแบนด์วิดท์อัตโนมัติเพื่อให้การสนทนาลื่นไหลในทุกสภาพเครือข่าย',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLNjFUJpKnjbZVhOpk__E5sIeHW54r111s6kfnFp31Dnxz3XRIJYp0rSbrgQbOMyLlfKyypAyyl_I07w4eq2le0PLquiR93a73IB2BwS-9k09EEJWVtU2CbYTzMmOKYuqygtwCtujtSjSdAxyTQn-SvFT914uCClLIkZSZ72KJCOU6S3GIMcvVGSvN0u1IxLKcZdW9Bds-9cvDv7uDFWieAp12Vy7qpchNy2VhZhtXYemnvnkDoJk',
    bgClass: 'bg-surface-dark',
    imgOpacity: 'opacity-60',
  },
];

const smallFeatures = [
  {
    icon: 'forum',
    title: 'Communities',
    desc: 'สร้างและจัดการคอมมูนิตี้ขนาดใหญ่ได้อย่างมีประสิทธิภาพ ด้วยเครื่องมือการบริหารจัดการสมาชิก การตั้งค่าสิทธิ์ผู้ดูแลระบบ และระบบประกาศข่าวสารที่เข้าถึงทุกคน',
  },
  {
    icon: 'amp_stories',
    title: 'Stories',
    desc: 'แบ่งปันช่วงเวลาสำคัญด้วยภาพและวิดีโอสั้นที่จะหายไปภายใน 24 ชั่วโมง พร้อมระบบควบคุมความเป็นส่วนตัวที่ให้คุณเลือกกลุ่มผู้ชมได้อย่างเจาะจง',
  },
  {
    icon: 'qr_code',
    title: 'QR Sync',
    desc: 'เชื่อมต่อบัญชีระหว่างอุปกรณ์มือถือและคอมพิวเตอร์อย่างรวดเร็วและปลอดภัยด้วยเทคโนโลยีสแกน QR Code ไม่ต้องจำรหัสผ่าน พร้อมระบบเตือนเมื่อมีการเข้าสู่ระบบ',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-canvas min-h-screen font-prompt text-ink antialiased overflow-x-hidden">
      {/* TopNav */}
      <nav className="w-full top-0 sticky bg-canvas z-50 border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-xl md:px-huge py-md max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-sm">
            <Link href="/" className="flex items-center gap-sm">
              <img
                alt="Arm Chat Logo"
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover shadow-sm"
                src="/brand/app-icon.png"
              />
              <span className="font-bold text-xl md:text-2xl text-ink tracking-tight">Arm Chat</span>
            </Link>
          </div>
          <div className="hidden md:flex gap-xxl items-center">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-ink-muted hover:text-primary transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="bg-primary-container text-ink rounded-full px-xl py-sm hover:opacity-90 active:scale-95 transition-all"
          >
            ดาวน์โหลดแอป
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full px-xl md:px-huge py-huge flex flex-col md:flex-row items-center justify-between min-h-[70vh] gap-huge max-w-screen-2xl mx-auto">
        <div className="flex-1 flex flex-col gap-lg text-left">
          <h1 className="text-display-xl-mobile md:text-display-xl text-ink max-w-2xl leading-tight">
            เชื่อมต่อทุกความรู้สึก ด้วยประสิทธิภาพสูงสุด
          </h1>
          <p className="text-body-lg text-ink-muted max-w-xl mt-md">
            ยกระดับการสื่อสารของคุณด้วยเครื่องมือที่ทรงพลัง รวดเร็ว และปลอดภัย
            ออกแบบมาเพื่อทั้งการใช้งานส่วนตัวและการทำงานระดับมืออาชีพ พร้อมระบบการจัดการข้อมูลที่เหนือระดับ
          </p>
          <div className="flex flex-col sm:flex-row gap-md mt-xl">
            <Link
              href="/login"
              className="bg-primary-container text-ink rounded-full px-xxl py-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
            >
              เริ่มต้นใช้งานฟรี
            </Link>
            <a
              href="#features"
              className="bg-transparent text-ink border border-outline rounded-full px-xxl py-md hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-sm"
            >
              ศึกษาฟีเจอร์เพิ่มเติม
            </a>
          </div>
        </div>
        <div className="flex-1 w-full h-[500px] relative rounded-card-lg overflow-hidden bg-surface-container border border-outline-variant">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Lifestyle professional using chat"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPslZCNrJ-sVRC6GenB0oedmgza_bY2roXiCFGrdfEVrzQ22fEMFTCm3Xt98NPyoshJz2-n9swd3QIuJuP_IGbojLZ4mSjifN2kI4eqAHK5V5Hcwc6nsO1NVLYZGYCB99_G07YumCXYVboxnT9QXdvPcafwwdDwUYxXW0MuN04lo0rfMtvibT6tbhVGF_-os2O416Y-LbhKS7misIQ1IaNF2qcyTOsU_b_wjppoaTi0qCMVRDfk84"
          />
        </div>
      </section>

      {/* Detailed Feature Grids */}
      <section id="features" className="w-full px-xl md:px-huge py-huge bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto flex flex-col gap-huge">
          <div className="text-center mb-xl">
            <h2 className="text-display-lg text-ink">ฟีเจอร์ครบครันเพื่อทุกการสื่อสาร</h2>
            <p className="text-body-lg text-ink-muted mt-md">
              ค้นพบเครื่องมือที่ออกแบบมาเพื่อตอบสนองทุกความต้องการ
            </p>
          </div>

          {/* Feature 1 & 2 — large */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface-white rounded-card-lg p-xxl border border-outline-variant flex flex-col gap-lg"
              >
                <span
                  className="material-symbols-outlined text-[48px] text-primary-container"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {f.icon}
                </span>
                <h3 className="text-display-md text-ink text-[32px]">{f.title}</h3>
                <p className="text-body-lg text-ink-muted">{f.desc}</p>
                <div
                  className={`mt-auto pt-lg w-full h-48 ${f.bgClass} rounded-xl flex items-center justify-center relative overflow-hidden`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`${f.title} mockup`}
                    className={`w-full h-full object-cover ${f.imgOpacity}`}
                    src={f.image}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Feature 3, 4, 5 — small */}
          <div id="enterprise" className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            {smallFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-surface-white rounded-card-lg p-xl border border-outline-variant flex flex-col gap-md"
              >
                <span
                  className="material-symbols-outlined text-[40px] text-primary-container"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {f.icon}
                </span>
                <h4 className="text-ink text-[28px]">{f.title}</h4>
                <p className="text-body-md text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy / Security */}
      <section
        id="security"
        className="w-full bg-surface-dark text-surface-white px-xl md:px-huge py-huge text-center flex flex-col items-center justify-center min-h-[60vh] gap-lg"
      >
        <span
          className="material-symbols-outlined text-[80px] text-primary-container mb-md"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          enhanced_encryption
        </span>
        <h2 className="text-display-lg text-surface-white tracking-widest uppercase">
          Enterprise-Grade Security
        </h2>
        <h3 className="text-display-md text-surface-white max-w-3xl mt-md text-[32px]">
          ความปลอดภัยระดับองค์กรในทุกการสนทนา
        </h3>
        <p className="text-body-lg text-surface-variant max-w-3xl mt-md">
          โครงสร้างพื้นฐานด้านความปลอดภัยของเราใช้การเข้ารหัสแบบ End-to-End Encryption ขั้นสูง
          มาตรฐานเดียวกับสถาบันการเงิน ข้อมูลทุกไบต์จะถูกเข้ารหัสตั้งแต่ต้นทางและสามารถถอดรหัสได้ที่อุปกรณ์ปลายทางเท่านั้น
          เราไม่เก็บประวัติการสนทนาของคุณไว้บนเซิร์ฟเวอร์
        </p>
      </section>

      {/* Final CTA */}
      <section className="w-full px-xl md:px-huge py-huge flex flex-col items-center justify-center text-center gap-lg max-w-screen-xl mx-auto min-h-[50vh]">
        <h2 className="text-display-xl-mobile md:text-display-xl text-ink">
          พร้อมยกระดับการสื่อสารของคุณ?
        </h2>
        <p className="text-ink-muted max-w-2xl text-[24px]">
          เข้าร่วมกับผู้ใช้งานหลายล้านคนที่ไว้วางใจระบบของเรา
        </p>
        <Link
          href="/login"
          className="bg-primary-container text-ink rounded-full px-xxl py-lg text-[20px] hover:opacity-90 active:scale-95 transition-all mt-xl flex items-center gap-sm"
        >
          ดาวน์โหลด Arm Chat
          <span className="material-symbols-outlined">download</span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}