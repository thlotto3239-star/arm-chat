'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BrandSplash } from '@/components/brand';
import { supabase } from '@/lib/supabase/client';

interface ChatItem {
  id: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup: boolean;
}

interface CallLogItem {
  id: string;
  name: string;
  avatarUrl: string;
  callType: string;
  time: string;
  status: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'groups'>('chats');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [calls, setCalls] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Group Creation Modal State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);

      // Fetch user's room memberships
      const { data: roomMemberships } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', currentUserId);

      let userRoomIds = roomMemberships ? roomMemberships.map(rm => rm.room_id) : [];

      if (userRoomIds.length === 0) {
        const { data: newRoom } = await supabase
          .from('rooms')
          .insert({
            name: 'กลุ่มนักพัฒนา Arm Chat (Official)',
            is_group: true,
            avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
          })
          .select()
          .single();

        if (newRoom) {
          await supabase.from('room_members').insert({
            room_id: newRoom.id,
            user_id: currentUserId,
            role: 'owner'
          });

          await supabase.from('messages').insert({
            room_id: newRoom.id,
            sender_id: currentUserId,
            content: 'ยินดีต้อนรับสู่ระบบ Arm Chat! ระบบเชื่อมต่อฐานข้อมูลเรียบร้อยแล้ว',
            type: 'text'
          });

          userRoomIds = [newRoom.id];
        }
      }

      if (userRoomIds.length > 0) {
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*')
          .in('id', userRoomIds);

        const loadedChats: ChatItem[] = [];

        for (const room of roomsData || []) {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let roomName = room.name || 'แชตไร้ชื่อ';
          let avatarUrl = room.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

          if (!room.is_group) {
            const { data: partnerMember } = await supabase
              .from('room_members')
              .select('user_id')
              .eq('room_id', room.id)
              .neq('user_id', currentUserId)
              .maybeSingle();

            if (partnerMember) {
              const { data: partnerProfile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', partnerMember.user_id)
                .single();

              if (partnerProfile) {
                roomName = partnerProfile.display_name || roomName;
                if (partnerProfile.avatar_url) avatarUrl = partnerProfile.avatar_url;
              }
            }
          }

          const msgTime = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'เมื่อสักครู่';

          loadedChats.push({
            id: room.id,
            name: roomName,
            avatarUrl: avatarUrl,
            lastMessage: lastMsg ? lastMsg.content : 'เริ่มการสนทนาใหม่...',
            time: msgTime,
            unread: 0,
            online: true,
            isGroup: room.is_group || false
          });
        }

        setChats(loadedChats);
      }

      // Fetch Call Logs
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('*')
        .or(`caller_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (callLogs && callLogs.length > 0) {
        setCalls(callLogs.map(c => ({
          id: c.id,
          name: c.call_type === 'video' ? 'วิดีโอคอลสด' : 'เสียง HD',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          callType: c.call_type,
          time: new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: c.status === 'ended' ? `ระยะเวลา ${c.duration_seconds || 0} วินาที` : c.status
        })));
      } else {
        setCalls([
          {
            id: 'call-1',
            name: 'สายโทรเสียง/วิดีโอ',
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5fLbjBs0-8kxCHeRywp-sz0Z3WUDB5B0UURCtzFK2VXLzLAN-kRLjWh_aNJ8cjo14xhGNPbcFnswzuybswny3Iq-kZ-4cdMNtNCzZjw_lwn4vRuayMY9hVOiO8H29YWr5-HGBAaXIywOVxBARJiuEWmJlOi8pK7m4XZu1TZePqby5Pe9NPm2oHkErA18UWdVhQt4WPAa5EWKoGN2WQwEwy1Ft8PnPZXMU6rFQpTJNkmF8ZmJsyhs',
            callType: 'video',
            time: '14:20',
            status: 'เสร็จสิ้น (03:15)'
          }
        ]);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !userId) return;

    try {
      const { data: newRoom, error } = await supabase
        .from('rooms')
        .insert({
          name: newGroupName.trim(),
          is_group: true,
          avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
        })
        .select()
        .single();

      if (error || !newRoom) return;

      await supabase.from('room_members').insert({
        room_id: newRoom.id,
        user_id: userId,
        role: 'owner'
      });

      setShowCreateGroup(false);
      setNewGroupName('');
      router.push(`/chat/${newRoom.id}`);
    } catch (err: any) {
      console.error('Error creating group:', err);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'groups' && !chat.isGroup) return false;
    return chat.name.toLowerCase().includes(search.toLowerCase()) || chat.lastMessage.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <BrandSplash message="กำลังโหลดแชต..." />;
  }

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[90px] pb-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-6 md:p-8 min-h-[650px] shadow-sm flex flex-col">
          {/* Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-ink/10">
            <div>
              <h1 className="text-3xl font-normal text-ink">กล่องข้อความ (Inbox)</h1>
              <p className="text-sm text-ink-muted">จัดการแชต ประวัติการโทร และกลุ่มสนทนาของคุณบนระบบคลาวด์</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="h-[44px] px-4 bg-primary-container border border-ink rounded-pill flex items-center justify-center gap-2 text-sm text-ink hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                <span>สร้างกลุ่มใหม่</span>
              </button>
              <Link
                href="/friends/add"
                className="h-[44px] px-4 bg-surface-container border border-ink rounded-pill flex items-center justify-center gap-2 text-sm text-ink hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>เพิ่มเพื่อน</span>
              </Link>
              <Link
                href="/qr"
                className="h-[44px] px-4 bg-surface-container border border-ink rounded-pill flex items-center justify-center gap-2 text-sm text-ink hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>QR Code</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเพื่อน ข้อความ หรือกลุ่มสนทนา..."
              className="w-full h-[48px] pl-12 pr-4 bg-surface-container border border-ink/30 rounded-pill text-sm text-ink focus:outline-none focus:border-ink transition-colors"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-[22px]">
              search
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-ink/10 pb-3">
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-5 py-2 rounded-pill text-sm font-normal transition-colors ${
                activeTab === 'chats' ? 'bg-ink text-surface-white' : 'text-ink-muted hover:bg-surface-container'
              }`}
            >
              แชตทั้งหมด ({chats.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-5 py-2 rounded-pill text-sm font-normal transition-colors ${
                activeTab === 'groups' ? 'bg-ink text-surface-white' : 'text-ink-muted hover:bg-surface-container'
              }`}
            >
              กลุ่มสนทนา ({chats.filter(c => c.isGroup).length})
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-5 py-2 rounded-pill text-sm font-normal transition-colors ${
                activeTab === 'calls' ? 'bg-ink text-surface-white' : 'text-ink-muted hover:bg-surface-container'
              }`}
            >
              ประวัติการโทร ({calls.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-ink-muted">
                <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                <p className="text-sm">กำลังโหลดข้อมูลแชต...</p>
              </div>
            ) : activeTab === 'calls' ? (
              <div className="divide-y divide-ink/10">
                {calls.map((call) => (
                  <div key={call.id} className="py-4 flex items-center justify-between hover:bg-surface-container/50 px-3 rounded-tile transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={call.avatarUrl} alt={call.name} className="w-12 h-12 rounded-full border border-ink object-cover" />
                      <div>
                        <h3 className="font-normal text-ink">{call.name}</h3>
                        <p className="text-xs text-ink-muted flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-green-600">
                            {call.callType === 'video' ? 'videocam' : 'call'}
                          </span>
                          <span>{call.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted">{call.time}</span>
                      <Link
                        href={`/call/${call.id}`}
                        className="w-10 h-10 bg-primary-container border border-ink rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-ink-muted">
                <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                <p className="text-sm">ยังไม่มีรายการแชตในหัวข้อนี้</p>
                <Link href="/friends/add" className="mt-2 px-4 py-2 bg-ink text-surface-white text-sm rounded-pill hover:opacity-90">
                  ค้นหาผู้ใช้และเริ่มแชตใหม่
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-ink/10">
                {filteredChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className="py-4 flex items-center justify-between hover:bg-surface-container/50 px-3 rounded-tile transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img src={chat.avatarUrl} alt={chat.name} className="w-12 h-12 rounded-full border border-ink object-cover" />
                        {chat.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-white rounded-full" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-normal text-ink truncate group-hover:text-primary transition-colors">
                            {chat.name}
                          </h3>
                          {chat.isGroup && (
                            <span className="px-2 py-0.5 bg-surface-container border border-ink/20 text-[10px] rounded-pill text-ink-muted">
                              กลุ่ม
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-muted truncate max-w-md">{chat.lastMessage}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-4">
                      <span className="text-xs text-ink-muted">{chat.time}</span>
                      {chat.unread > 0 && (
                        <span className="px-2 py-0.5 bg-primary text-ink text-xs font-bold rounded-pill">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-white border border-ink rounded-tile max-w-md w-full p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowCreateGroup(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div>
              <h3 className="text-xl font-normal text-ink">สร้างกลุ่มสนทนาใหม่</h3>
              <p className="text-xs text-ink-muted mt-1">ตั้งชื่อกลุ่มของคุณเพื่อเริ่มพูดคุยกันหลายคน</p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-normal text-ink block mb-1">ชื่อกลุ่มสนทนา</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="เช่น ทีมพัฒนา Arm Chat..."
                  className="w-full h-11 px-4 bg-canvas border border-ink rounded-pill text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="h-10 px-4 bg-surface-container border border-ink/20 rounded-pill text-xs text-ink hover:bg-surface-container-high"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="h-10 px-5 bg-ink text-surface-white rounded-pill text-xs font-normal hover:opacity-90 disabled:opacity-50"
                >
                  สร้างกลุ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
