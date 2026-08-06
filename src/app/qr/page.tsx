'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';

export default function QrPage() {
  const [activeTab, setActiveTab] = useState<'myCode' | 'scan'>('myCode');
  const [displayName, setDisplayName] = useState('ผู้ใช้งาน');
  const [username, setUsername] = useState('arm_user');
  const [qrUrl, setQrUrl] = useState('https://arm-chat.vercel.app/friends/add');
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.display_name) setDisplayName(profile.display_name);
          if (profile.username) {
            setUsername(profile.username);
            setQrUrl(`https://arm-chat.vercel.app/friends/add?user=${profile.username}`);
          }
        }
      }
    }

    loadUserProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'scan') {
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn('Camera access error:', err);
        }
      }
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-lg mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-8 text-center shadow-sm">
          <h1 className="text-3xl font-normal text-ink mb-2">QR Code ของคุณ</h1>
          <p className="text-sm text-ink-muted mb-6">
            ให้เพื่อนของคุณสแกน QR Code นี้เพื่อเพิ่มคุณใน Arm Chat ได้ทันที
          </p>

          {/* Toggle Tab */}
          <div className="flex bg-canvas p-1 rounded-pill border border-ink mb-8">
            <button
              onClick={() => setActiveTab('myCode')}
              className={`flex-1 py-2 rounded-pill font-prompt text-sm transition-all ${
                activeTab === 'myCode' ? 'bg-primary-container text-ink font-normal border border-ink' : 'text-ink-muted'
              }`}
            >
              คิวอาร์โค้ดของฉัน
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2 rounded-pill font-prompt text-sm transition-all ${
                activeTab === 'scan' ? 'bg-primary-container text-ink font-normal border border-ink' : 'text-ink-muted'
              }`}
            >
              สแกน QR Code
            </button>
          </div>

          {activeTab === 'myCode' ? (
            <div className="space-y-6">
              {/* QR Code Container */}
              <div className="w-64 h-64 mx-auto bg-white border-2 border-ink rounded-tile p-4 flex flex-col items-center justify-center shadow-md relative group">
                <QRCodeSVG
                  value={qrUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute -bottom-3 bg-primary-container text-ink px-4 py-1 rounded-full text-xs font-bold border border-ink">
                  @{username}
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xl font-normal text-ink">{displayName}</h3>
                <p className="text-xs text-ink-muted mt-1">Arm Chat ID: @{username}</p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={handleCopyLink}
                  className="h-[44px] px-6 bg-surface-container border border-ink rounded-pill text-sm hover:bg-surface-container-high transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              <div className="w-full h-64 mx-auto border-2 border-dashed border-primary rounded-tile flex flex-col items-center justify-center bg-black relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="w-full h-0.5 bg-primary animate-pulse absolute top-1/2 shadow-lg" />
              </div>
              <p className="text-xs text-ink-muted">ส่องกล้องไปที่ QR Code ของเพื่อนเพื่อเพิ่มเพื่อนอัตโนมัติ</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
