'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BrandSplash } from '@/components/brand';
import { supabase } from '@/lib/supabase/client';

interface StoryItem {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  media_url: string;
  caption: string;
  time: string;
  views_count: number;
  reactions: Record<string, number>;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      const { data: dbStories } = await supabase
        .from('stories')
        .select('*, profiles(display_name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (dbStories && dbStories.length > 0) {
        setStories(
          dbStories.map((s) => ({
            id: s.id,
            user_id: s.user_id,
            display_name: s.profiles?.display_name || 'เพื่อนผู้ใช้',
            avatar_url: s.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            media_url: s.media_url,
            caption: s.caption || '',
            time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            views_count: s.views_count || 0,
            reactions: s.reactions || {}
          }))
        );
      } else {
        setStories([
          {
            id: 'demo-s1',
            user_id: 'system',
            display_name: 'Arm Chat Updates',
            avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
            media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            caption: 'ระบบเรื่องราว 24 ชั่วโมงเปิดใช้งานเรียบร้อยแล้ว!',
            time: '10 นาทีที่แล้ว',
            views_count: 12,
            reactions: { '❤️': 5 }
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenStoryModal = async (story: StoryItem) => {
    setSelectedStory(story);

    // Update views count in Supabase
    if (!story.id.startsWith('demo-')) {
      const newCount = (story.views_count || 0) + 1;
      await supabase
        .from('stories')
        .update({ views_count: newCount })
        .eq('id', story.id);
    }
  };

  const handleStoryReaction = async (storyId: string, emoji: string) => {
    if (!selectedStory) return;

    const currentReactions = { ...(selectedStory.reactions || {}) };
    currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;

    setSelectedStory({ ...selectedStory, reactions: currentReactions });

    if (!storyId.startsWith('demo-')) {
      await supabase
        .from('stories')
        .update({ reactions: currentReactions })
        .eq('id', storyId);
    }
  };

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มเรื่องราว');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `user_stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file);

      if (uploadError) {
        alert('อัปโหลดเรื่องราวล้มเหลว: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      const mediaUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from('stories').insert({
        user_id: session.user.id,
        media_url: mediaUrl,
        caption: 'อัปเดตเรื่องราวใหม่'
      });

      if (insertError) {
        alert('บันทึกเรื่องราวล้มเหลว: ' + insertError.message);
        return;
      }

      alert('เพิ่มเรื่องราวของคุณเรียบร้อยแล้ว!');
      fetchStories();
    } catch (err: any) {
      console.error('Add story error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-5xl mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-6 md:p-10 shadow-sm">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-ink/10">
            <div>
              <h1 className="text-3xl font-normal text-ink">เรื่องราว (Stories / Status)</h1>
              <p className="text-sm text-ink-muted">อัปเดตสถานะประจำวันที่จัดเก็บลง Supabase และหายไปอัตโนมัติใน 24 ชั่วโมง</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddStory}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-[44px] px-6 bg-primary-container text-ink border border-ink rounded-pill font-prompt text-sm font-normal hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                {uploading ? 'sync' : 'add_photo_alternate'}
              </span>
              <span>{uploading ? 'กำลังอัปโหลด...' : '+ เพิ่มเรื่องราวของคุณ'}</span>
            </button>
          </div>

          {/* My Story Tile */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-4 p-4 rounded-2xl bg-canvas border border-ink/10 mb-8 cursor-pointer hover:border-ink transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-secondary-container border-2 border-primary border-dashed flex items-center justify-center relative flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">add_a_photo</span>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-container text-ink font-bold text-xs flex items-center justify-center border border-ink">
                +
              </div>
            </div>
            <div>
              <div className="font-prompt text-base font-normal text-ink">เรื่องราวของฉัน (My Story)</div>
              <div className="text-xs text-ink-muted">แตะเพื่อเลือกรูปภาพและบันทึกลง Supabase Storage</div>
            </div>
          </div>

          <h3 className="text-sm font-normal text-ink-muted uppercase tracking-wider mb-4">อัปเดตล่าสุดจากเพื่อน</h3>

          {loading ? (
            <div className="flex justify-center p-12">
              <BrandSplash message="กำลังโหลดเรื่องราว..." className="min-h-0" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleOpenStoryModal(story)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-surface-white border border-ink/20 hover:border-ink transition-all cursor-pointer group"
                >
                  <img
                    src={story.avatar_url}
                    alt={story.display_name}
                    className="w-14 h-14 rounded-full border-2 border-primary object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-prompt text-base font-normal text-ink group-hover:text-primary transition-colors truncate">
                      {story.display_name}
                    </div>
                    <div className="text-xs text-ink-muted flex items-center gap-2">
                      <span>{story.time}</span>
                      <span>• <span className="material-symbols-outlined text-[14px] align-text-bottom">visibility</span> {story.views_count} คนดู</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-ink-muted group-hover:translate-x-1 transition-transform">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-white border border-ink rounded-tile max-w-md w-full overflow-hidden flex flex-col shadow-2xl relative">
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="p-4 bg-canvas border-b border-ink/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedStory.avatar_url} alt={selectedStory.display_name} className="w-10 h-10 rounded-full border border-ink object-cover" />
                <div>
                  <h4 className="font-prompt text-sm font-normal text-ink">{selectedStory.display_name}</h4>
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    {selectedStory.time} • <span className="material-symbols-outlined text-[14px]">visibility</span> {selectedStory.views_count} รับชม
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-hidden bg-black flex items-center justify-center relative">
              <img src={selectedStory.media_url} alt="Story content" className="w-full h-full object-contain max-h-[60vh]" />
            </div>

            {/* Reactions Toolbar */}
            <div className="p-3 bg-canvas border-t border-ink/10 flex items-center justify-around">
              <button onClick={() => handleStoryReaction(selectedStory.id, '❤️')} className="text-xl hover:scale-125 transition-transform">❤️</button>
              <button onClick={() => handleStoryReaction(selectedStory.id, '🔥')} className="text-xl hover:scale-125 transition-transform">🔥</button>
              <button onClick={() => handleStoryReaction(selectedStory.id, '😮')} className="text-xl hover:scale-125 transition-transform">😮</button>
              <button onClick={() => handleStoryReaction(selectedStory.id, '👏')} className="text-xl hover:scale-125 transition-transform">👏</button>
            </div>

            {selectedStory.caption && (
              <div className="p-4 bg-surface-white border-t border-ink/10 text-sm text-ink font-prompt">
                {selectedStory.caption}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
