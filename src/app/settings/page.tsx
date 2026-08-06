'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('ผู้ใช้งาน');
  const [username, setUsername] = useState('user');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Preferences & Presence States
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [prefGroups, setPrefGroups] = useState(true);
  const [prefCalls, setPrefCalls] = useState(true);
  const [prefStories, setPrefStories] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('08:00');
  const [presenceStatus, setPresenceStatus] = useState('online');
  const [language, setLanguage] = useState('th');
  const [userId, setUserId] = useState<string | null>(null);
  const [pushOptedIn, setPushOptedIn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.display_name) setDisplayName(profile.display_name);
        if (profile.username) setUsername(profile.username);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (typeof profile.notification_enabled === 'boolean') setNotifications(profile.notification_enabled);
        if (typeof profile.read_receipts_enabled === 'boolean') setReadReceipts(profile.read_receipts_enabled);
        if (typeof profile.pref_groups === 'boolean') setPrefGroups(profile.pref_groups);
        if (typeof profile.pref_calls === 'boolean') setPrefCalls(profile.pref_calls);
        if (typeof profile.pref_stories === 'boolean') setPrefStories(profile.pref_stories);
        if (typeof profile.dnd_enabled === 'boolean') setDndEnabled(profile.dnd_enabled);
        if (profile.dnd_start) setDndStart(profile.dnd_start);
        if (profile.dnd_end) setDndEnd(profile.dnd_end);
        if (profile.presence_status) setPresenceStatus(profile.presence_status);
        if (profile.language) setLanguage(profile.language);
      }
    }

    loadSettings();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const readPushState = () => {
      const w = window as any;
      if (!w.OneSignal || !w.OneSignal.Notifications) return;
      setPushOptedIn(w.OneSignal.Notifications.permission === true);
    };
    readPushState();
  }, [userId]);

  const togglePushNotifications = async () => {
    const w = window as any;
    if (!w.OneSignal || !w.OneSignal.User || !w.OneSignal.User.PushSubscription) {
      alert('ระบบแจ้งเตือนยังไม่พร้อม กรุณาลองใหม่ภายหลัง');
      return;
    }
    setPushBusy(true);
    try {
      if (pushOptedIn) {
        await w.OneSignal.User.PushSubscription.optOut();
        setPushOptedIn(false);
        await updateSetting('notification_enabled', false);
      } else {
        await w.OneSignal.User.PushSubscription.optIn();
        setPushOptedIn(true);
        await updateSetting('notification_enabled', true);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const updateSetting = async (field: string, value: any) => {
    if (!userId) return;
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId);
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try { await OneSignal.logout(); } catch { /* noop */ }
      });
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-4xl mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-6 md:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="text-3xl font-normal text-ink">การตั้งค่า (Settings & Preferences)</h1>
            <p className="text-sm text-ink-muted">จัดการโหมดห้ามรบกวน (DND), สถานะออนไลน์, หมวดการแจ้งเตือน และภาษาในแอป</p>
          </div>

          {/* Account Profile Card */}
          <div className="flex items-center gap-4 p-6 bg-canvas rounded-2xl border border-ink/20">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-ink bg-surface-container flex-shrink-0">
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-normal text-ink truncate">{displayName}</div>
              <div className="text-xs text-ink-muted truncate">@{username} • {email}</div>
              <span className="text-[11px] bg-primary-container text-ink px-2.5 py-0.5 rounded-full border border-ink font-normal inline-block mt-1">
                สถานะ: {presenceStatus.toUpperCase()}
              </span>
            </div>
            <Link
              href="/onboarding"
              className="h-[40px] px-4 bg-surface-white border border-ink rounded-pill text-xs hover:bg-surface-container font-normal flex items-center gap-1 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>แก้ไขโปรไฟล์</span>
            </Link>
          </div>

          {/* Presence Status Selector */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-ink border-b border-ink/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">account_circle</span>
              <span>สถานะการออนไลน์ (Presence Status)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'online', label: 'Online', desc: 'ออนไลน์สด', dot: 'bg-[#25d366]' },
                { id: 'away', label: 'Away', desc: 'ไม่อยู่ชั่วคราว', dot: 'bg-amber-400' },
                { id: 'busy', label: 'Busy', desc: 'ห้ามรบกวน', dot: 'bg-red-500' },
                { id: 'invisible', label: 'Invisible', desc: 'ซ่อนสถานะ', dot: 'bg-ink/30' },
                { id: 'offline', label: 'Offline', desc: 'ออฟไลน์', dot: 'bg-ink/60' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPresenceStatus(item.id);
                    updateSetting('presence_status', item.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    presenceStatus === item.id ? 'bg-primary-container border-ink font-bold' : 'bg-canvas border-ink/20 hover:border-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`}></span>
                    <div className="text-sm text-ink">{item.label}</div>
                  </div>
                  <div className="text-[10px] text-ink-muted">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Do Not Disturb (DND) Section */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-ink border-b border-ink/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">do_not_disturb_on</span>
              <span>โหมดห้ามรบกวนตามเวลา (Do Not Disturb - DND)</span>
            </h3>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-normal text-ink">เปิดโหมดห้ามรบกวนอัตโนมัติ</div>
                <div className="text-xs text-ink-muted">ปิดเสียงเตือนในช่วงเวลาพักผ่อน โดยยังคงเก็บประวัติไว้</div>
              </div>
              <button
                onClick={() => {
                  const nextVal = !dndEnabled;
                  setDndEnabled(nextVal);
                  updateSetting('dnd_enabled', nextVal);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative border border-ink ${
                  dndEnabled ? 'bg-primary-container' : 'bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface-white border border-ink absolute top-0.5 transition-transform ${
                    dndEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {dndEnabled && (
              <div className="flex items-center gap-4 bg-canvas p-4 rounded-2xl border border-ink/10 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1">เริ่มช่วงเวลา</label>
                  <input
                    type="time"
                    value={dndStart}
                    onChange={(e) => {
                      setDndStart(e.target.value);
                      updateSetting('dnd_start', e.target.value);
                    }}
                    className="px-3 py-1.5 bg-surface-white border border-ink/30 rounded-lg text-ink"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1">สิ้นสุดช่วงเวลา</label>
                  <input
                    type="time"
                    value={dndEnd}
                    onChange={(e) => {
                      setDndEnd(e.target.value);
                      updateSetting('dnd_end', e.target.value);
                    }}
                    className="px-3 py-1.5 bg-surface-white border border-ink/30 rounded-lg text-ink"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Browser Push Notifications */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-ink border-b border-ink/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
              <span>การแจ้งเตือนของเบราว์เซอร์ (Push Notifications)</span>
            </h3>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-normal text-ink">เปิดใช้งานการแจ้งเตือน</div>
                <div className="text-xs text-ink-muted">
                  {pushOptedIn
                    ? 'เปิดอยู่ — คุณจะได้รับแจ้งเตือนเมื่อมีข้อความใหม่'
                    : 'ยังไม่เปิด — กดเพื่อขอสิทธิ์จากเบราว์เซอร์'}
                </div>
              </div>
              <button
                onClick={togglePushNotifications}
                disabled={pushBusy}
                className={`w-12 h-6 rounded-full transition-colors relative border border-ink disabled:opacity-50 ${
                  pushOptedIn ? 'bg-primary-container' : 'bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface-white border border-ink absolute top-0.5 transition-transform ${
                    pushOptedIn ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Categories Preferences */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-ink border-b border-ink/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
              <span>เลือกรับการแจ้งเตือนตามหมวดหมู่ (Push Categories)</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: 'แจ้งเตือนแชตกลุ่ม (Group Activity)', state: prefGroups, setter: setPrefGroups, field: 'pref_groups' },
                { label: 'แจ้งเตือนสายโทรสด (Calls & WebRTC)', state: prefCalls, setter: setPrefCalls, field: 'pref_calls' },
                { label: 'แจ้งเตือนอัปเดตเรื่องราว (Stories)', state: prefStories, setter: setPrefStories, field: 'pref_stories' },
                { label: 'แสดงเครื่องหมายอ่านแล้ว (Read Receipts)', state: readReceipts, setter: setReadReceipts, field: 'read_receipts_enabled' },
              ].map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-sm text-ink">{cat.label}</span>
                  <button
                    onClick={() => {
                      const nextVal = !cat.state;
                      cat.setter(nextVal);
                      updateSetting(cat.field, nextVal);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative border border-ink ${
                      cat.state ? 'bg-primary-container' : 'bg-surface-container-high'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-surface-white border border-ink absolute top-0.5 transition-transform ${
                        cat.state ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Language / Localization */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-ink border-b border-ink/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">language</span>
              <span>ภาษาแอปพลิเคชัน (Localization)</span>
            </h3>

            <div className="flex gap-3">
              {[
                { code: 'th', label: '🇹🇭 ภาษาไทย' },
                { code: 'en', label: '🇺🇸 English' },
                { code: 'zh', label: '🇨🇳 中文' },
                { code: 'ja', label: '🇯🇵 日本語' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    updateSetting('language', lang.code);
                  }}
                  className={`px-4 py-2 rounded-pill border text-xs transition-all ${
                    language === lang.code ? 'bg-ink text-surface-white font-bold' : 'bg-canvas text-ink border-ink/20 hover:border-ink'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-ink/10 flex justify-end">
            <button
              onClick={handleSignOut}
              className="h-[44px] px-6 bg-red-600 text-white rounded-pill text-sm font-normal hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
