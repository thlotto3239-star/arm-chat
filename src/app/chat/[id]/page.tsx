'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase/client';
import { notifyRoomMembers } from '@/lib/notifications';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  time: string;
  type: 'text' | 'image' | 'audio' | 'file';
  media_url?: string;
  isMe: boolean;
  reply_to_id?: string | null;
  replyText?: string;
  reactions?: Record<string, number>;
  is_edited?: boolean;
  deleted_at?: string | null;
}

interface RoomInfo {
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || 'demo';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({
    name: 'ห้องแชต',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isOnline: true
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('ผู้ใช้');
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [partnerTypingStatus, setPartnerTypingStatus] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const uid = session.user.id;
      setCurrentUserId(uid);

      // Fetch current profile name
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', uid)
        .single();
      if (myProfile?.display_name) setCurrentUserName(myProfile.display_name);

      // Fetch room metadata
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData) {
        let rName = roomData.name || 'แชตคู่สนทนา';
        let rAvatar = roomData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

        if (!roomData.is_group) {
          const { data: partnerMember } = await supabase
            .from('room_members')
            .select('user_id')
            .eq('room_id', roomId)
            .neq('user_id', uid)
            .maybeSingle();

          if (partnerMember) {
            const { data: partnerProfile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('id', partnerMember.user_id)
              .single();

            if (partnerProfile) {
              rName = partnerProfile.display_name || rName;
              if (partnerProfile.avatar_url) rAvatar = partnerProfile.avatar_url;
            }
          }
        }

        setRoomInfo({ name: rName, avatarUrl: rAvatar, isOnline: true });
      }

      // Fetch initial message history
      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        setMessages(
          history.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: m.type || 'text',
            media_url: m.media_url,
            isMe: m.sender_id === uid,
            reply_to_id: m.reply_to_id,
            reactions: m.reactions || {},
            is_edited: m.is_edited || false,
            deleted_at: m.deleted_at
          }))
        );
      }

      // Supabase Realtime Channel (DB Changes + Broadcast Typing)
      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } }
      });

      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
          (payload) => {
            const newMsg = payload.new;
            if (newMsg) {
              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [
                  ...prev,
                  {
                    id: newMsg.id,
                    sender_id: newMsg.sender_id,
                    text: newMsg.content,
                    time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: newMsg.type || 'text',
                    media_url: newMsg.media_url,
                    isMe: newMsg.sender_id === uid,
                    reply_to_id: newMsg.reply_to_id,
                    reactions: newMsg.reactions || {},
                    is_edited: newMsg.is_edited || false,
                    deleted_at: newMsg.deleted_at
                  }
                ];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
          (payload) => {
            const updated = payload.new;
            if (updated) {
              setMessages(prev => prev.map(m => m.id === updated.id ? {
                ...m,
                text: updated.content,
                reactions: updated.reactions || {},
                is_edited: updated.is_edited || false,
                deleted_at: updated.deleted_at
              } : m));
            }
          }
        )
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload?.user !== currentUserName) {
            setPartnerTypingStatus(payload.payload?.status || null);
            setTimeout(() => setPartnerTypingStatus(null), 3000);
          }
        })
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }

    initChat();
  }, [roomId, router]);

  // Handle typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (channelRef.current && e.target.value.length > 0) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: currentUserName, status: 'กำลังพิมพ์...' }
      });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;

    const textToSend = input.trim();
    setInput('');

    if (editingMsg) {
      // Update existing message
      await supabase
        .from('messages')
        .update({ content: textToSend, is_edited: true })
        .eq('id', editingMsg.id);
      setEditingMsg(null);
      return;
    }

    // Insert message into Supabase DB
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      content: textToSend,
      type: 'text',
      reply_to_id: replyingTo?.id || null
    });

    setReplyingTo(null);

    if (error) {
      console.error('Error sending message:', error.message);
    } else {
      notifyRoomMembers({
        roomId,
        senderId: currentUserId,
        senderName: currentUserName,
        content: textToSend,
        type: 'text'
      });
    }
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user: currentUserName, status: 'กำลังอัดเสียง...' }
        });
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const uploadAudioMessage = async (blob: Blob) => {
    if (!currentUserId) return;
    try {
      setUploading(true);
      const fileName = `voice_${Date.now()}.webm`;
      const filePath = `chat_${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, blob);

      if (uploadError) return;

      const { data: publicUrlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: currentUserId,
        content: `[ข้อความเสียง ${recordingSeconds} วินาที]`,
        type: 'audio',
        media_url: publicUrlData.publicUrl
      });

      notifyRoomMembers({
        roomId,
        senderId: currentUserId,
        senderName: currentUserName,
        content: `[ข้อความเสียง ${recordingSeconds} วินาที]`,
        type: 'audio'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat_${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file);

      if (uploadError) {
        alert('อัปโหลดไฟล์ล้มเหลว: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      const isImg = file.type.startsWith('image/');
      const contentText = isImg ? '[รูปภาพ]' : `[ไฟล์แนบ: ${file.name}]`;

      await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: currentUserId,
        content: contentText,
        type: isImg ? 'image' : 'file',
        media_url: publicUrlData.publicUrl
      });

      notifyRoomMembers({
        roomId,
        senderId: currentUserId,
        senderName: currentUserName,
        content: contentText,
        type: isImg ? 'image' : 'file'
      });
    } catch (err: any) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    const target = messages.find(m => m.id === msgId);
    if (!target) return;

    const currentReactions = { ...(target.reactions || {}) };
    currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;

    await supabase
      .from('messages')
      .update({ reactions: currentReactions })
      .eq('id', msgId);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) {
      await supabase
        .from('messages')
        .update({ content: 'ข้อความนี้ถูกลบแล้ว', deleted_at: new Date().toISOString() })
        .eq('id', msgId);
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[85px] pb-6 px-4 md:px-12 max-w-6xl mx-auto w-full flex flex-col h-[calc(100vh-85px)]">
        <div className="bg-surface-white border border-ink rounded-tile flex-1 flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="h-[72px] bg-canvas border-b border-ink/10 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chats" className="p-2 hover:bg-surface-container rounded-full transition-colors text-ink">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-ink bg-surface-container flex-shrink-0">
                <img src={roomInfo.avatarUrl} alt={roomInfo.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-prompt text-base font-normal text-ink">{roomInfo.name}</div>
                <div className="text-xs text-primary font-normal flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#25d366] inline-block" />
                  <span>{partnerTypingStatus || 'ออนไลน์สด'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/call/${roomId}`}
                className="w-10 h-10 bg-primary-container border border-ink rounded-full flex items-center justify-center text-ink hover:opacity-90 transition-opacity"
                title="โทรวิดีโอสด HD"
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </Link>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-canvas/40">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col group ${msg.isMe ? 'items-end' : 'items-start'}`}>
                {/* Quote Reply Card if exists */}
                {msg.reply_to_id && (
                  <div className="text-xs bg-surface-container/80 border-l-4 border-primary p-2 rounded-lg mb-1 text-ink-muted max-w-[70%]">
                    ตอบกลับข้อความก่อนหน้า
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-tile p-4 border text-sm leading-relaxed relative ${
                    msg.isMe
                      ? 'bg-primary-container text-ink border-ink rounded-br-none'
                      : 'bg-surface-white text-ink border-ink/20 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.deleted_at ? (
                    <p className="italic text-ink-muted">{msg.text}</p>
                  ) : msg.type === 'image' && msg.media_url ? (
                    <div className="space-y-2">
                      <img src={msg.media_url} alt="Media" className="max-w-full max-h-60 rounded-tile object-cover border border-ink/20" />
                      <p>{msg.text}</p>
                    </div>
                  ) : msg.type === 'audio' && msg.media_url ? (
                    <div className="space-y-2 min-w-[200px]">
                      <audio controls src={msg.media_url} className="w-full h-8" />
                      <p className="text-xs">{msg.text}</p>
                    </div>
                  ) : msg.type === 'file' && msg.media_url ? (
                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <span className="material-symbols-outlined">description</span>
                      <span>ดาวน์โหลดไฟล์แนบ</span>
                    </a>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.text}
                      {msg.is_edited && <span className="text-[10px] text-ink-muted ml-2">(แก้ไขแล้ว)</span>}
                    </p>
                  )}

                  {/* Reaction Badges */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <span key={emoji} className="px-2 py-0.5 bg-surface-white border border-ink/20 rounded-full text-xs">
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Toolbar on Hover */}
                  {!msg.deleted_at && (
                    <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-surface-white border border-ink rounded-full px-2 py-0.5 shadow-md">
                      <button onClick={() => handleReaction(msg.id, '❤️')} className="hover:scale-125 text-xs">❤️</button>
                      <button onClick={() => handleReaction(msg.id, '👍')} className="hover:scale-125 text-xs">👍</button>
                      <button onClick={() => setReplyingTo(msg)} className="text-ink-muted hover:text-ink text-xs flex items-center" title="ตอบกลับ">
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                      </button>
                      {msg.isMe && (
                        <>
                          <button onClick={() => { setEditingMsg(msg); setInput(msg.text); }} className="text-ink-muted hover:text-ink text-xs flex items-center" title="แก้ไข">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 hover:scale-110 text-xs flex items-center" title="ลบ">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${msg.isMe ? 'text-ink/70' : 'text-ink-muted'}`}>
                    <span>{msg.time}</span>
                    {msg.isMe && <span className="material-symbols-outlined text-[14px] text-green-700">done_all</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply / Edit Banner */}
          {(replyingTo || editingMsg) && (
            <div className="px-4 py-2 bg-canvas border-t border-ink/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="material-symbols-outlined text-[16px]">{editingMsg ? 'edit' : 'reply'}</span>
                <span>{editingMsg ? `กำลังแก้ไขข้อความ: "${editingMsg.text}"` : `กำลังตอบกลับ: "${replyingTo?.text}"`}</span>
              </div>
              <button onClick={() => { setReplyingTo(null); setEditingMsg(null); setInput(''); }} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 bg-surface-white border-t border-ink/10 flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,doc,docx" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-11 h-11 bg-surface-container border border-ink/20 rounded-full flex items-center justify-center text-ink hover:bg-surface-container-high transition-colors flex-shrink-0 disabled:opacity-50"
              title="แนบรูปภาพหรือไฟล์"
            >
              <span className="material-symbols-outlined text-[22px]">
                {uploading ? 'sync' : 'attach_file'}
              </span>
            </button>

            {/* Mic / Audio Recorder Button */}
            {isRecording ? (
              <div className="flex items-center gap-2 bg-red-100 border border-red-500 rounded-pill px-4 py-2 text-red-600 text-xs font-bold animate-pulse">
                <span>กำลังอัดเสียง ({recordingSeconds}s)...</span>
                <button type="button" onClick={stopRecording} className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded-full">
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-11 h-11 bg-surface-container border border-ink/20 rounded-full flex items-center justify-center text-ink hover:bg-surface-container-high transition-colors flex-shrink-0"
                title="กดเพื่ออัดเสียงสด"
              >
                <span className="material-symbols-outlined text-[22px]">mic</span>
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="พิมพ์ข้อความของคุณที่นี่..."
              className="flex-1 h-11 px-4 bg-surface-container border border-ink/30 rounded-pill text-sm text-ink focus:outline-none focus:border-ink transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="h-11 px-6 bg-ink text-surface-white rounded-pill text-sm font-normal flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0"
            >
              <span>{editingMsg ? 'อัปเดต' : 'ส่ง'}</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
