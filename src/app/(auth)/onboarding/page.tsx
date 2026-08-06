'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArmChatLogo } from '@/components/brand';
import { AvatarUpload, UniqueIdCard, InviteLinkCard } from '@/components/auth';
import { Button, Input, Icon } from '@/shared/design-system';
import { supabase } from '@/lib/supabase/client';
import { isProfileComplete, isUsernameAvailable } from '@/lib/auth/session';

type Step = 1 | 2 | 3;

/** Deterministic 4-digit from user.id → ARM-XXXX-TH */
function deriveUid(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return `ARM-${String(hash).padStart(4, '0')}-TH`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const uid = useMemo(() => (userId ? deriveUid(userId) : ''), [userId]);
  const inviteHref = useMemo(() => `arm.chat/u/${username || 'username'}`, [username]);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userEmail, setUserEmail] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active) return;
        if (!session?.user) {
          router.replace('/login');
          return;
        }
        setUserId(session.user.id);

        const googleMeta = session.user.user_metadata || {};
        const googleEmail = session.user.email || '';
        const googleName = googleMeta.full_name || googleMeta.name || (googleEmail ? googleEmail.split('@')[0] : '');
        const googleAvatar = googleMeta.avatar_url || googleMeta.picture || '';

        setUserEmail(googleEmail);
        setIsGoogleUser(
          session.user.app_metadata?.provider === 'google' ||
            Boolean(googleMeta.avatar_url || googleMeta.full_name || googleEmail.endsWith('@gmail.com'))
        );

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, bio, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUsername(
            profile.username || (googleEmail ? googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') : '')
          );
          setDisplayName(profile.display_name || googleName || '');
          setBio(profile.bio || '');
          setAvatarUrl(profile.avatar_url || googleAvatar || '');
        } else {
          setDisplayName(googleName || '');
          setAvatarUrl(googleAvatar || '');
          if (googleEmail) {
            setUsername(googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, ''));
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        if (active) setInitialLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  // Debounced username availability check against profiles.username.
  useEffect(() => {
    if (!userId) return;
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const name = username.trim();
    checkTimer.current = setTimeout(async () => {
      if (name.length < 3) {
        setUsernameState('idle');
        return;
      }
      setUsernameState('checking');
      const available = await isUsernameAvailable(name, userId);
      setUsernameState(available ? 'available' : 'taken');
    }, name.length < 3 ? 0 : 400);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username, userId]);

  const handleNext = async () => {
    if (step === 1) {
      if (!displayName.trim() || usernameState !== 'available') return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            username: username.trim(),
            display_name: displayName.trim() || 'User_' + username.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );
      if (error) throw error;
      setSaved(true);
      setTimeout(() => router.push('/chats'), 1200);
    } catch (err: any) {
      console.error('Save profile error:', err);
      alert('ไม่สามารถบันทึกข้อมูลได้: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Icon name="progress_activity" className="animate-spin text-[32px] text-primary" />
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'ข้อมูลพื้นฐาน' },
    { n: 2, label: 'รหัสประจำตัวของคุณ' },
    { n: 3, label: 'พร้อมใช้งาน' },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl items-start">
      {/* Left: Branding + Progress rail (arm_chat_2:140-169) */}
      <div className="lg:col-span-5 flex flex-col gap-xl">
        <ArmChatLogo layout="horizontal" size="md" />

        <div className="mt-md">
          <h1 className="text-3xl md:text-4xl text-ink leading-tight mb-sm">
            ยินดีต้อนรับสู่พื้นที่แชทของคุณ
          </h1>
          <p className="text-lg text-ink-muted max-w-md">
            ตั้งค่าโปรไฟล์ของคุณในไม่กี่ขั้นตอนเพื่อเริ่มต้นการเชื่อมต่อที่เรียบง่ายและเป็นส่วนตัว
          </p>
        </div>

        <nav className="flex flex-col gap-md mt-xl" aria-label="ขั้นตอนการตั้งค่า">
          {steps.map((s) => {
            const isActive = step === s.n;
            const isDone = step > s.n;
            return (
              <div key={s.n} className={`flex items-center gap-md transition-opacity ${isActive ? '' : 'opacity-40'}`}>
                <span
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                    isActive || isDone
                      ? 'border-primary bg-primary text-surface-white'
                      : 'border-outline text-ink'
                  }`}
                >
                  {isDone ? <Icon name="check" className="text-[16px]" /> : s.n}
                </span>
                <span className="text-base text-ink">{s.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right: Step content */}
      <div className="lg:col-span-7 bg-surface-white border border-ink p-xl md:p-xxl rounded-tile relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative space-y-xl">
          {step === 1 && (
            <div className="space-y-xl">
              {isGoogleUser && (
                <div className="bg-surface-container-high/60 border border-ink/20 p-md rounded-2xl flex items-center justify-between gap-md">
                  <div className="flex items-center gap-md min-w-0">
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google Logo"
                      className="w-5 h-5 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-ink whitespace-nowrap">ซิงก์ข้อมูลด้วยบัญชี Google เรียบร้อย</p>
                      {userEmail && <p className="text-[11px] text-ink-muted truncate">{userEmail}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] text-primary bg-primary-container/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Google Synced
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center mb-xl">
                <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} name={displayName} />
              </div>

              <div className="space-y-lg">
                <div className="flex flex-col gap-xs">
                  <label htmlFor="display-name" className="text-xs text-ink px-md">
                    ชื่อที่แสดงผล
                  </label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ระบุชื่อของคุณ..."
                    inputSize="md"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label htmlFor="username" className="text-xs text-ink px-md">
                    Username (@unique)
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    inputSize="md"
                    startAddon={<span className="text-ink-muted">@</span>}
                  />
                  <p className="text-[11px] text-primary px-md flex items-center gap-xs">
                    {usernameState === 'checking' && (
                      <>
                        <Icon name="progress_activity" className="text-[14px] animate-spin" />
                        กำลังตรวจสอบ...
                      </>
                    )}
                    {usernameState === 'available' && (
                      <>
                        <Icon name="check_circle" className="text-[14px]" fill={1} />
                        Username นี้สามารถใช้งานได้
                      </>
                    )}
                    {usernameState === 'taken' && (
                      <span className="text-error">
                        <Icon name="error" className="text-[14px] align-text-bottom" />
                        ชื่อนี้ถูกใช้แล้ว — ลองชื่ออื่น
                      </span>
                    )}
                    {usernameState === 'idle' && 'Username อย่างน้อย 3 ตัวอักษร'}
                  </p>
                </div>

                <div className="flex flex-col gap-xs">
                  <label htmlFor="bio" className="text-xs text-ink px-md">
                    ข้อความต้อนรับ / สถานะ (Bio)
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full p-md bg-surface-white border border-ink rounded-tile text-base text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-xl">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  iconName="arrow_forward"
                  disabled={!displayName.trim() || usernameState !== 'available'}
                  onClick={handleNext}
                >
                  ดำเนินการต่อ
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-xl">
              <h2 className="text-2xl text-ink mb-md">เอกลักษณ์ส่วนตัวของคุณ</h2>
              <div className="bg-surface-container-low rounded-tile p-xl border border-dashed border-outline space-y-lg">
                <UniqueIdCard uid={uid} />
                <InviteLinkCard href={inviteHref} />
              </div>

              <div className="pt-xl flex gap-md">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  ย้อนกลับ
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="flex-[2]"
                  iconName="qr_code_2"
                  onClick={() => setStep(3)}
                >
                  ตรวจสอบ QR Code
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-xl">
              <div className="text-center space-y-md">
                <h2 className="text-2xl text-ink">พร้อมแล้ว! เริ่มการแชทได้เลย</h2>
                <p className="text-base text-ink-muted px-xl">
                  เพื่อนๆ สามารถสแกน QR Code นี้เพื่อเพิ่มคุณเป็นเพื่อนได้ทันที
                </p>
              </div>

              <div className="flex flex-col items-center justify-center my-xl">
                <div className="p-xl bg-white border-2 border-ink rounded-tile relative">
                  <QRCodeSVG
                    value={inviteHref}
                    size={192}
                    level="M"
                    fgColor="#1C1E21"
                    bgColor="#ffffff"
                  />
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary-container rounded-full border border-ink flex items-center justify-center">
                    <Icon name="download" className="text-ink" />
                  </div>
                </div>
              </div>

              <div className="pt-xl flex flex-col gap-md">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={saving}
                  iconName="bolt"
                  iconFill={1}
                  onClick={handleFinish}
                >
                  {saved ? 'เสร็จสิ้น!' : 'เสร็จสิ้นและเริ่มแชท'}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-10 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  แก้ไขรหัสประจำตัว
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
