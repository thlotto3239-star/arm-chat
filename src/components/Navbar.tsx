'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArmChatLogo } from '@/components/brand';

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body: string;
  deep_link: string;
  is_read: boolean;
  created_at: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);

  const [latestToast, setLatestToast] = useState<NotifItem | null>(null);

  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore audio errors */
    }
  }, []);

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', uid)
      .single();

    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

    const { data: history } = await supabase
      .from('notifications_history')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(15);

    if (history) {
      setNotifications(history);
      const unread = history.filter(n => !n.is_read).length;
      setUnreadCount(unread);

      if (typeof document !== 'undefined') {
        document.title = unread > 0 ? `(${unread}) Arm Chat - แชตและวิดีโอคอล` : 'Arm Chat - แชตและวิดีโอคอล';
      }
    }
  }, []);

  useEffect(() => {
    let realtimeChannel: any = null;

    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const uid = session.user.id;
        setUser(session.user);
        fetchNotifications(uid);

        // Realtime Subscription for Notifications
        realtimeChannel = supabase
          .channel(`user-notifs-${uid}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications_history',
              filter: `user_id=eq.${uid}`,
            },
            (payload) => {
              const newNotif = payload.new as NotifItem;
              setNotifications((prev) => [newNotif, ...prev.slice(0, 14)]);
              setUnreadCount((prev) => {
                const updated = prev + 1;
                if (typeof document !== 'undefined') {
                  document.title = `(${updated}) Arm Chat - แชตและวิดีโอคอล`;
                }
                return updated;
              });
              setLatestToast(newNotif);
              playNotificationChime();

              setTimeout(() => {
                setLatestToast(null);
              }, 5000);
            }
          )
          .subscribe();
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchNotifications(session.user.id);

        if (typeof window !== 'undefined') {
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function (OneSignal: any) {
            await OneSignal.login(session.user.id);
          });
        }
      } else {
        setUser(null);
        setAvatarUrl('');
        setUnreadCount(0);
        if (typeof window !== 'undefined') {
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function (OneSignal: any) {
            try { await OneSignal.logout(); } catch { /* noop */ }
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [fetchNotifications, playNotificationChime]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications_history').update({ is_read: true }).eq('user_id', user.id);
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    if (typeof document !== 'undefined') document.title = 'Arm Chat - แชตและวิดีโอคอล';
  };

  const isLanding = pathname === '/';

  const appNavLinks = [
    { href: '/', label: 'หน้าแรก', icon: 'home' },
    { href: '/chats', label: 'แชตทั้งหมด', icon: 'chat' },
    { href: '/stories', label: 'เรื่องราว', icon: 'auto_stories' },
    { href: '/qr', label: 'สแกน QR', icon: 'qr_code_scanner' },
    { href: '/friends/add', label: 'เพิ่มเพื่อน', icon: 'person_add' },
    { href: '/settings', label: 'การตั้งค่า', icon: 'settings' },
  ];

  const marketingNavLinks = [
    { href: '#about', label: 'Arm Chat คืออะไร', icon: 'info' },
    { href: '#features', label: 'ฟีเจอร์', icon: 'apps' },
    { href: '#security', label: 'ความเป็นส่วนตัว', icon: 'lock' },
  ];

  const navLinks = isLanding && !user ? marketingNavLinks : appNavLinks;

  return (
    <nav className="fixed top-0 left-0 w-full h-[72px] bg-canvas/95 backdrop-blur-md border-b border-ink/10 flex justify-between items-center px-6 md:px-12 z-50 transition-all font-prompt">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ArmChatLogo layout="horizontal" size="sm" className="transition-transform group-hover:scale-105" />
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-pill font-prompt text-sm font-normal transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-ink text-surface-white'
                  : 'text-ink-muted hover:bg-surface-container hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 relative">
            {/* Notification Center Trigger (Item #12 & #3) */}
            <button
              onClick={() => setShowNotifCenter(!showNotifCenter)}
              className="w-10 h-10 rounded-full bg-surface-container border border-ink/20 flex items-center justify-center hover:bg-surface-container-high relative transition-colors"
              title="ศูนย์การแจ้งเตือน (Notification Center)"
            >
              <span className="material-symbols-outlined text-[22px] text-ink">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-surface-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Center Dropdown */}
            {showNotifCenter && (
              <div className="absolute top-12 right-0 w-80 sm:w-96 bg-surface-white border border-ink rounded-tile shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                  <div className="font-normal text-sm text-ink flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">notifications_active</span>
                    <span>ศูนย์การแจ้งเตือน (Notification Center)</span>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-ink/10 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink-muted">ยังไม่มีรายการแจ้งเตือนใหม่</div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.deep_link}
                        onClick={() => setShowNotifCenter(false)}
                        className={`block p-2.5 rounded-2xl hover:bg-canvas transition-colors ${!n.is_read ? 'bg-primary-container/20 border-l-4 border-primary' : ''}`}
                      >
                        <div className="text-xs font-normal text-ink">{n.title}</div>
                        <div className="text-[11px] text-ink-muted truncate">{n.body}</div>
                        <div className="text-[9px] text-ink-muted mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            <Link
              href="/onboarding"
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-pill bg-surface-container border border-ink/20 hover:border-ink transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-ink bg-surface-white flex-shrink-0">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-prompt text-xs font-normal text-ink truncate max-w-[100px]">
                {user.email?.split('@')[0]}
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="h-[40px] px-5 bg-surface-container border border-ink rounded-pill font-prompt text-xs font-normal text-ink hover:bg-surface-container-high transition-colors flex items-center justify-center"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login"
              className="h-[40px] px-5 bg-primary-container border border-ink rounded-pill font-prompt text-xs font-normal text-ink hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        )}
      </div>

      {/* Floating Realtime Notification Toast */}
      {latestToast && (
        <div className="fixed top-20 right-6 z-[100] max-w-sm w-full bg-surface-white border border-ink/30 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-primary-container/40 flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined text-[20px]">
              {latestToast.type === 'friend_request'
                ? 'person_add'
                : latestToast.type === 'friend_accepted'
                ? 'check_circle'
                : 'chat'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-ink truncate">{latestToast.title}</h4>
              <button
                onClick={() => setLatestToast(null)}
                className="text-ink-muted hover:text-ink text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">{latestToast.body}</p>
            <Link
              href={latestToast.deep_link}
              onClick={() => setLatestToast(null)}
              className="inline-block text-[11px] text-primary hover:underline mt-1 font-medium"
            >
              เปิดดู →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
