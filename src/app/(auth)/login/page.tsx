'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArmChatLogo } from '@/components/brand';
import { OtpInput, OtpSimulator } from '@/components/auth';
import { Button, Icon } from '@/shared/design-system';
import { supabase } from '@/lib/supabase/client';
import { generateOtpCode, normalizePhone, phoneToIdentity } from '@/lib/auth/otp';
import { isProfileComplete, onSignedIn } from '@/lib/auth/session';

type Step = 'options' | 'phone' | 'verify' | 'success';

const GOOGLE_LOGO_URL =
  'https://www.svgrepo.com/show/475656/google-color.svg';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('options');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);

  // Already signed in + profile complete → straight to inbox.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (active && session?.user && (await isProfileComplete(session.user.id))) {
        router.replace('/chats');
      }
    })();
    const unsubscribe = onSignedIn(async (userId) => {
      if (active && (await isProfileComplete(userId))) {
        router.replace('/chats');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
        },
      });
      if (error) {
        // A4 fix: no silent redirect on failure.
        setErrorMsg('เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ลองอีกครั้ง หรือใช้หมายเลขโทรศัพท์แทน');
      }
    } catch {
      setErrorMsg('เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ลองอีกครั้ง หรือใช้หมายเลขโทรศัพท์แทน');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedPhone) return;
    setErrorMsg('');
    setOtpCode(generateOtpCode());
    setOtpValue('');
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
        // First sign-up: supabase may not create a session (confirmation off → it does).
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (retryErr) throw retryErr;
      }
      setStep('success');
      setTimeout(() => router.push('/onboarding'), 1400);
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการยืนยัน OTP — ลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtpCode(generateOtpCode());
    setOtpValue('');
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-[480px]">
      {/* Brand identity (arm_chat_1:142-145) */}
      <div className="text-center mb-xl">
        <ArmChatLogo layout="stacked" size="md" className="justify-center mb-sm" />
        <p className="text-base text-ink-muted">เชื่อมต่อถึงกันด้วยความเรียบง่าย</p>
      </div>

      {/* Auth card */}
      <div className="bg-surface-white rounded-tile border border-ink p-xxl md:p-[32px] shadow-sm transition-all duration-500 overflow-hidden">
        {step === 'options' && (
          <div className="space-y-lg">
            <h2 className="text-lg text-ink text-center mb-xl">ยินดีต้อนรับกลับมา</h2>

            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              loading={loading}
              onClick={handleGoogle}
              className="gap-md"
            >
              <img src={GOOGLE_LOGO_URL} alt="Google Logo" className="w-6 h-6" />
              <span>ดำเนินการต่อด้วย Google</span>
            </Button>

            <div className="flex items-center gap-md py-md" role="separator" aria-label="หรือ">
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
            >
              เข้าสู่ระบบด้วยเบอร์โทรศัพท์
            </Button>

            {errorMsg && (
              <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
            )}
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-lg">
            <div className="flex items-center mb-lg">
              <Button
                type="button"
                variant="ghost"
                iconOnly
                iconName="arrow_back"
                onClick={() => setStep('options')}
                aria-label="ย้อนกลับ"
              />
              <h2 className="text-lg text-ink ml-xs">เบอร์โทรศัพท์ของคุณ</h2>
            </div>

            <form onSubmit={handleStartPhone} className="space-y-lg">
              <div className="space-y-base">
                <span className="block text-xs text-ink-muted px-md">หมายเลขโทรศัพท์</span>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 text-base text-ink">+66</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81-234-5678"
                    className="w-full h-[54px] pl-[64px] pr-md rounded-full border border-ink bg-surface-white text-base text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                    aria-label="หมายเลขโทรศัพท์"
                  />
                </div>
              </div>

              <p className="text-xs text-ink-muted text-center italic">
                &ldquo;รหัสจะแสดงในแอปเพื่อความปลอดภัยสูงสุด&rdquo;
              </p>

              <Button type="submit" variant="primary" size="md" fullWidth>
                รับรหัสยืนยัน
              </Button>
            </form>

            {errorMsg && (
              <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-lg">
            <div className="text-center space-y-md">
              <h2 className="text-lg text-ink">ยืนยันตัวตนในแอป</h2>
              <p className="text-base text-ink-muted">
                กรุณาใส่รหัส 6 หลักที่แสดงอยู่บนหน้าจอเครื่องหลักของคุณ
              </p>

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
            >
              ยืนยัน OTP และเข้าสู่ระบบ
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-primary underline hover:text-ink transition-colors"
              >
                ส่งรหัสอีกครั้ง
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-error text-center" role="alert">{errorMsg}</p>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-lg text-center py-xl">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-lg">
              <Icon name="check" className="text-[40px] text-ink" />
            </div>
            <h2 className="text-3xl text-ink">สำเร็จ!</h2>
            <p className="text-base text-ink-muted">กำลังนำคุณเข้าสู่ Arm Chat...</p>
          </div>
        )}
      </div>
    </div>
  );
}
