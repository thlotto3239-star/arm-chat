'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArmChatLogo } from '@/components/brand';
import { OtpInput, OtpSimulator, AuthBrandSide } from '@/components/auth';
import { Button, Icon } from '@/shared/design-system';
import { supabase } from '@/lib/supabase/client';
import { generateOtpCode, normalizePhone, phoneToIdentity } from '@/lib/auth/otp';
import { isProfileComplete, onSignedIn } from '@/lib/auth/session';

type Step = 'options' | 'phone' | 'verify' | 'success';

const GOOGLE_LOGO_URL = 'https://www.svgrepo.com/show/475656/google-color.svg';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('options');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);

  // If already signed in, navigate to chats or onboarding
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (active && session?.user) {
        const complete = await isProfileComplete(session.user.id);
        router.replace(complete ? '/chats' : '/onboarding');
      }
    })();
    const unsubscribe = onSignedIn(async (userId) => {
      if (active) {
        const complete = await isProfileComplete(userId);
        router.replace(complete ? '/chats' : '/onboarding');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  const handleGoogleRegister = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
        },
      });
      if (error) {
        setErrorMsg('สมัครสมาชิกด้วย Google ไม่สำเร็จ — ลองอีกครั้ง หรือใช้หมายเลขโทรศัพท์แทน');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาด — ลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedPhone) return;
    setErrorMsg('');
    const generated = generateOtpCode();
    setOtpCode(generated);
    setOtpValue(generated);
    setStep('verify');
  };

  const handleConfirmOtp = async () => {
    if (!otpCode || otpValue !== otpCode) {
      setErrorMsg('รหัสยืนยันไม่ถูกต้อง — ลองอีกครั้ง');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { email, password } = phoneToIdentity(normalizedPhone);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (retryErr) throw retryErr;
      }
      setStep('success');
      setTimeout(() => router.push('/onboarding'), 1200);
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการยืนยัน OTP — ลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    const generated = generateOtpCode();
    setOtpCode(generated);
    setOtpValue(generated);
    setErrorMsg('');
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-canvas">
      {/* LEFT SIDE: Member Registration Form & Logo */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 border-r border-outline/10">
        {/* Top Logo & Header */}
        <div className="flex items-center justify-between gap-md mb-8 lg:mb-12">
          <Link href="/" className="inline-flex items-center">
            <ArmChatLogo layout="horizontal" size="md" />
          </Link>

          <span className="text-xs text-primary bg-primary-container/80 font-medium px-3 py-1 rounded-full border border-primary/20">
            สมัครสมาชิก
          </span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto space-y-8 my-auto py-6">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">สร้างบัญชีผู้ใช้ใหม่</h1>
            <p className="text-sm sm:text-base text-ink-muted">
              สมัครสมาชิก Arm Chat เพื่อรับประสบการณ์การสื่อสารที่ปลอดภัยและเป็นส่วนตัว
            </p>
          </div>

          <div className="bg-surface-white rounded-tile border border-ink/20 p-6 sm:p-8 shadow-sm space-y-6">
            {step === 'options' && (
              <div className="space-y-6">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  loading={loading}
                  onClick={handleGoogleRegister}
                  className="gap-md h-12"
                >
                  <img src={GOOGLE_LOGO_URL} alt="Google Logo" className="w-5 h-5 shrink-0" />
                  <span>สมัครด้วย Google</span>
                </Button>

                <div className="flex items-center gap-md py-1" role="separator" aria-label="หรือ">
                  <div className="h-[1px] flex-grow bg-surface-variant" />
                  <span className="text-xs text-ink-muted">หรือ</span>
                  <div className="h-[1px] flex-grow bg-surface-variant" />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  iconName="call"
                  onClick={() => {
                    setStep('phone');
                    setErrorMsg('');
                  }}
                  className="h-12"
                >
                  สมัครด้วยเบอร์โทรศัพท์
                </Button>

                {errorMsg && (
                  <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
                )}
              </div>
            )}

            {step === 'phone' && (
              <div className="space-y-6">
                <div className="flex items-center gap-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    iconOnly
                    iconName="arrow_back"
                    onClick={() => setStep('options')}
                    aria-label="ย้อนกลับ"
                  />
                  <h2 className="text-base font-semibold text-ink">เบอร์โทรศัพท์สำหรับลงทะเบียน</h2>
                </div>

                <form onSubmit={handleStartPhone} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-phone" className="block text-xs font-medium text-ink-muted px-1">
                      หมายเลขโทรศัพท์มือถือ
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink">+66</span>
                      <input
                        id="reg-phone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="81-234-5678"
                        className="w-full h-12 pl-16 pr-4 rounded-full border border-ink/30 bg-surface-white text-sm text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted text-center italic">
                    &ldquo;ระบบส่งรหัสยืนยัน OTP ฟรีเพื่อความปลอดภัย&rdquo;
                  </p>

                  <Button type="submit" variant="primary" size="md" fullWidth className="h-12">
                    ส่งรหัสยืนยัน OTP
                  </Button>
                </form>

                {errorMsg && (
                  <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
                )}
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-base font-semibold text-ink">ยืนยัน OTP ลงทะเบียน</h2>
                  <p className="text-xs text-ink-muted">
                    กรอกรหัสยืนยัน 6 หลักที่เราสร้างขึ้นสำหรับเบอร์ของคุณ
                  </p>

                  <div className="bg-primary-container/30 border border-primary/30 p-3 rounded-2xl flex items-center justify-center gap-2">
                    <Icon name="check_circle" className="text-primary text-[18px]" fill={1} />
                    <span className="text-xs text-ink">ป้อนรหัส ({otpCode}) ให้อัตโนมัติแล้ว</span>
                  </div>

                  <OtpInput length={6} value={otpValue} onChange={setOtpValue} disabled={loading} />

                  <OtpSimulator code={otpCode} onFill={setOtpValue} disabled={loading} />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                  onClick={handleConfirmOtp}
                  disabled={otpValue.length !== 6}
                  className="h-12"
                >
                  ยืนยัน OTP และสร้างบัญชี
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-xs text-primary underline hover:text-ink transition-colors"
                  >
                    ส่งรหัส OTP อีกครั้ง
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
                )}
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto">
                  <Icon name="check" className="text-[32px] text-ink" />
                </div>
                <h2 className="text-2xl font-bold text-ink">สมัครสมาชิกสำเร็จ!</h2>
                <p className="text-sm text-ink-muted">กำลังนำคุณไปยังขั้นตอนการตั้งค่าโปรไฟล์...</p>
              </div>
            )}
          </div>

          {/* Switch to Login */}
          <div className="text-center text-xs text-ink-muted">
            มีบัญชี Arm Chat อยู่แล้วใช่ไหม?{' '}
            <Link href="/login" className="font-semibold text-primary underline hover:text-ink transition-colors">
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-muted">
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">ข้อกำหนดการใช้งาน</Link>
            <Link href="#" className="hover:text-primary transition-colors">ความเป็นส่วนตัว</Link>
            <Link href="#" className="hover:text-primary transition-colors">ช่วยเหลือ</Link>
          </div>
          <p>© 2026 Arm Chat Thailand</p>
        </footer>
      </div>

      {/* RIGHT SIDE: Brand Image & Highlights Panel */}
      <div className="hidden lg:block lg:w-1/2 xl:w-7/12">
        <AuthBrandSide />
      </div>
    </div>
  );
}
