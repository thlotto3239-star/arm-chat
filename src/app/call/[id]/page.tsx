'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function CallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || 'demo-room';

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [partnerName, setPartnerName] = useState('สมาชิกห้องโทรสด');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 1. Timer count
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // 2. Access local camera and microphone stream
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Microphone access not granted or unavailable:', err);
      }
    }

    // 3. Log call start in Supabase
    async function logCallStart() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('call_logs').insert({
          room_id: roomId.includes('-') ? null : roomId,
          caller_id: session.user.id,
          call_type: 'video',
          status: 'in-progress'
        });
      }
    }

    startMedia();
    logCallStart();

    return () => {
      clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCamOn;
      });
    }
    setIsCamOn(!isCamOn);
  };

  const handleHangUp = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Save end call duration to Supabase call_logs
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('call_logs').insert({
        caller_id: session.user.id,
        call_type: 'video',
        duration_seconds: callDuration,
        status: 'ended'
      });
    }

    router.push('/chats');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-dark min-h-screen flex flex-col font-prompt text-surface-white overflow-hidden relative">
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 top-gradient flex justify-between items-center z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={handleHangUp}
            className="w-10 h-10 rounded-full bg-surface-white/20 hover:bg-surface-white/30 backdrop-blur-md flex items-center justify-center text-surface-white transition-colors border border-surface-white/30"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="font-prompt text-lg font-normal text-surface-white">ห้องโทรวิดีโอ (Arm Call HD)</div>
            <div className="text-xs text-primary-fixed">ห้องสนทนา: {String(roomId)} • เข้ารหัสปลอดภัยตลอดสาย</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary-container text-ink rounded-full text-xs font-bold border border-surface-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>LIVE {formatTime(callDuration)}</span>
          </span>
        </div>
      </div>

      {/* Main Video Stream Container */}
      <main className="flex-1 relative flex items-center justify-center p-4 pt-24 pb-28">
        {/* Main Participant Video Feed */}
        <div className="relative w-full max-w-5xl h-full max-h-[75vh] bg-ink rounded-tile border border-surface-white/20 overflow-hidden flex items-center justify-center shadow-2xl">
          {isCamOn ? (
            <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
              {/* Local Real Camera Video Stream */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-pill text-xs border border-surface-white/20">
                กล้องของคุณ (Live Camera HD)
              </div>
            </div>
          ) : (
            <div className="text-center text-surface-white/60 space-y-2">
              <span className="material-symbols-outlined text-[48px]">videocam_off</span>
              <p className="text-sm">ปิดกล้องวิดีโออยู่</p>
            </div>
          )}

          {/* Picture-in-Picture Self/Partner Stream (PiP) */}
          <div className="absolute bottom-6 right-6 w-44 h-32 bg-surface-dark border-2 border-surface-white/40 rounded-2xl overflow-hidden shadow-pip flex items-center justify-center bg-slate-900">
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Partner"
                className="w-10 h-10 rounded-full border border-surface-white object-cover mb-1"
              />
              <span className="text-[11px] font-normal text-surface-white">{partnerName}</span>
              <span className="text-[9px] text-green-400">● เชื่อมต่อสด</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Floating Call Controls */}
      <div className="absolute bottom-0 left-0 w-full p-6 control-gradient flex justify-center items-center gap-6 z-30">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border border-surface-white/40 ${
            isMicOn ? 'bg-surface-white/20 hover:bg-surface-white/30 text-surface-white' : 'bg-red-600 text-white'
          }`}
          title={isMicOn ? 'ปิดไมค์' : 'เปิดไมค์'}
        >
          <span className="material-symbols-outlined text-[24px]">{isMicOn ? 'mic' : 'mic_off'}</span>
        </button>

        <button
          onClick={toggleCam}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border border-surface-white/40 ${
            isCamOn ? 'bg-surface-white/20 hover:bg-surface-white/30 text-surface-white' : 'bg-red-600 text-white'
          }`}
          title={isCamOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
        >
          <span className="material-symbols-outlined text-[24px]">{isCamOn ? 'videocam' : 'videocam_off'}</span>
        </button>

        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border border-surface-white/40 ${
            isScreenSharing ? 'bg-primary text-ink' : 'bg-surface-white/20 hover:bg-surface-white/30 text-surface-white'
          }`}
          title="แชร์หน้าจอ"
        >
          <span className="material-symbols-outlined text-[24px]">present_to_all</span>
        </button>

        <button
          onClick={handleHangUp}
          className="w-16 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all border border-surface-white/40 shadow-lg"
          title="วางสาย"
        >
          <span className="material-symbols-outlined text-[26px]">call_end</span>
        </button>
      </div>
    </div>
  );
}
