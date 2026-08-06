'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';
import { notifyFriendRequest, notifyFriendAccepted } from '@/lib/notifications';

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  isFriend: boolean;
  isBlocked: boolean;
}

interface PendingRequest {
  id: string;
  sender_id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

export default function AddFriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'pending'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState('@user');

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const uid = session.user.id;
        setCurrentUserId(uid);

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', uid)
          .single();
        if (profile?.username) setMyUsername(`@${profile.username}`);

        // Fetch Pending Friend Requests
        const { data: pendings } = await supabase
          .from('friendships')
          .select('id, user_id, profiles!friendships_user_id_fkey(display_name, username, avatar_url)')
          .eq('friend_id', uid)
          .eq('status', 'pending');

        if (pendings) {
          setPendingRequests(
            pendings.map((p: any) => ({
              id: p.id,
              sender_id: p.user_id,
              display_name: p.profiles?.display_name || 'ผู้ใช้งาน',
              username: p.profiles?.username || 'user',
              avatar_url: p.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }))
          );
        }
      }
    }
    loadData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const cleanQuery = query.replace('@', '').trim();

      const { data: dbUsers } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
        .neq('id', currentUserId || '')
        .limit(10);

      if (dbUsers) {
        const { data: myFriendships } = await supabase
          .from('friendships')
          .select('friend_id, status')
          .eq('user_id', currentUserId || '');

        const friendMap = new Map(myFriendships?.map(f => [f.friend_id, f.status]) || []);

        setResults(
          dbUsers.map(u => ({
            id: u.id,
            username: u.username || 'user',
            display_name: u.display_name || 'ผู้ใช้งาน',
            avatar_url: u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            isFriend: friendMap.get(u.id) === 'accepted',
            isBlocked: friendMap.get(u.id) === 'blocked'
          }))
        );
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!currentUserId) return;

    await supabase.from('friendships').insert({
      user_id: currentUserId,
      friend_id: friendId,
      status: 'pending'
    });

    // Get current user profile name for notification
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', currentUserId)
      .single();

    const senderName = myProfile?.display_name || 'ผู้ใช้งาน';
    notifyFriendRequest(friendId, senderName);

    setResults(prev =>
      prev.map(r => (r.id === friendId ? { ...r, isFriend: true } : r))
    );
  };

  const handleAcceptRequest = async (reqId: string, senderId: string) => {
    if (!currentUserId) return;

    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', reqId);

    // Create reciprocal friendship
    await supabase.from('friendships').insert({
      user_id: currentUserId,
      friend_id: senderId,
      status: 'accepted'
    });

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', currentUserId)
      .single();

    const acceptorName = myProfile?.display_name || 'ผู้ใช้งาน';
    notifyFriendAccepted(senderId, acceptorName);

    setPendingRequests(prev => prev.filter(p => p.id !== reqId));
    alert('ยอมรับคำขอเป็นเพื่อนเรียบร้อยแล้ว!');
  };

  const handleRejectRequest = async (reqId: string) => {
    await supabase.from('friendships').delete().eq('id', reqId);
    setPendingRequests(prev => prev.filter(p => p.id !== reqId));
  };

  const handleBlockUser = async (friendId: string) => {
    if (!currentUserId) return;
    if (confirm('คุณต้องการบล็อกผู้ใช้งานนี้ใช่หรือไม่?')) {
      await supabase.from('friendships').upsert({
        user_id: currentUserId,
        friend_id: friendId,
        status: 'blocked'
      });
      setResults(prev =>
        prev.map(r => (r.id === friendId ? { ...r, isBlocked: true } : r))
      );
    }
  };

  const handleStartChat = async (partnerId: string, partnerName: string) => {
    if (!currentUserId) return;

    const { data: myRooms } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', currentUserId);

    const roomIds = myRooms?.map(r => r.room_id) || [];

    if (roomIds.length > 0) {
      const { data: sharedRoom } = await supabase
        .from('room_members')
        .select('room_id, rooms!inner(is_group)')
        .in('room_id', roomIds)
        .eq('user_id', partnerId)
        .eq('rooms.is_group', false)
        .maybeSingle();

      if (sharedRoom) {
        router.push(`/chat/${sharedRoom.room_id}`);
        return;
      }
    }

    const { data: newRoom } = await supabase
      .from('rooms')
      .insert({ name: partnerName, is_group: false })
      .select()
      .single();

    if (newRoom) {
      await supabase.from('room_members').insert([
        { room_id: newRoom.id, user_id: currentUserId, role: 'owner' },
        { room_id: newRoom.id, user_id: partnerId, role: 'member' }
      ]);
      router.push(`/chat/${newRoom.id}`);
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-4xl mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-6 md:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="text-3xl font-normal text-ink">เพิ่มเพื่อนใหม่ (Add Friends)</h1>
            <p className="text-sm text-ink-muted">ค้นหาเพื่อน ตอบรับคำขอ และจัดการความสัมพันธ์เพื่อนในระบบ</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex bg-canvas p-1 rounded-pill border border-ink">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2.5 rounded-pill text-sm font-normal transition-all ${
                activeTab === 'search' ? 'bg-primary-container text-ink border border-ink' : 'text-ink-muted'
              }`}
            >
              ค้นหาเพื่อนใหม่
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2.5 rounded-pill text-sm font-normal transition-all relative ${
                activeTab === 'pending' ? 'bg-primary-container text-ink border border-ink' : 'text-ink-muted'
              }`}
            >
              คำขอเป็นเพื่อน ({pendingRequests.length})
            </button>
          </div>

          {activeTab === 'pending' ? (
            <div className="space-y-4">
              <h3 className="text-base font-normal text-ink">รายการคำขอเป็นเพื่อนที่รอการตอบรับ</h3>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-ink-muted py-8 text-center">ไม่มีคำขอเป็นเพื่อนใหม่ในขณะนี้</p>
              ) : (
                <div className="divide-y divide-ink/10">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={req.avatar_url} alt={req.display_name} className="w-12 h-12 rounded-full border border-ink object-cover" />
                        <div>
                          <div className="font-prompt text-base font-normal text-ink">{req.display_name}</div>
                          <div className="text-xs text-ink-muted">@{req.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.sender_id)}
                          className="h-[40px] px-5 bg-ink text-surface-white rounded-pill text-sm hover:opacity-90 transition-opacity"
                        >
                          ตอบรับ
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="h-[40px] px-4 bg-surface-container border border-ink/20 text-ink rounded-pill text-sm hover:bg-surface-container-high"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/qr"
                  className="p-6 bg-canvas border border-ink rounded-2xl flex items-center gap-4 hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center border border-ink text-ink group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                  </div>
                  <div>
                    <div className="text-base font-normal text-ink group-hover:text-primary transition-colors">สแกน QR Code</div>
                    <div className="text-xs text-ink-muted">เพิ่มเพื่อนจาก QR Code ส่วนตัว</div>
                  </div>
                </Link>

                <div className="p-6 bg-canvas border border-ink rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center border border-ink text-ink">
                    <span className="material-symbols-outlined text-[24px]">badge</span>
                  </div>
                  <div>
                    <div className="text-base font-normal text-ink">ID ของฉัน: <span className="text-primary font-normal">{myUsername}</span></div>
                    <div className="text-xs text-ink-muted">แชร์ ID ให้เพื่อนค้นหาคุณ</div>
                  </div>
                </div>
              </div>

              {/* Search Box */}
              <div className="space-y-4 pt-4 border-t border-ink/10">
                <h3 className="text-base font-normal text-ink">ค้นหาเพื่อนด้วย ID หรือ ชื่อผู้ใช้</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อ หรือ Username เช่น @somchai..."
                    className="w-full h-[52px] pl-12 pr-6 bg-canvas border border-ink rounded-pill text-ink focus:outline-none focus:ring-2 focus:ring-primary font-prompt text-sm"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-[22px]">
                    search
                  </span>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center p-8 text-ink-muted">
                    <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                  </div>
                ) : results.length === 0 && searchQuery ? (
                  <p className="text-sm text-ink-muted text-center py-6">ไม่พบผู้ใช้งานที่ตรงกับข้อความค้นหา</p>
                ) : (
                  results.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-canvas border border-ink/20 rounded-2xl flex items-center justify-between hover:border-ink transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img src={user.avatar_url} alt={user.display_name} className="w-12 h-12 rounded-full border border-ink object-cover" />
                        <div>
                          <div className="font-prompt text-base font-normal text-ink">{user.display_name}</div>
                          <div className="text-xs text-ink-muted">@{user.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.isBlocked ? (
                          <span className="text-xs text-red-500 font-bold">ถูกบล็อกแล้ว</span>
                        ) : user.isFriend ? (
                          <button
                            onClick={() => handleStartChat(user.id, user.display_name)}
                            className="h-[40px] px-4 bg-primary-container text-ink border border-ink rounded-pill text-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            <span>เริ่มแชต</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="h-[40px] px-5 bg-ink text-surface-white rounded-pill text-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>เพิ่มเพื่อน</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleBlockUser(user.id)}
                          className="p-2 text-ink-muted hover:text-red-600 rounded-full"
                          title="บล็อกผู้ใช้"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
