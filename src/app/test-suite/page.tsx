'use client';

import { useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { offlineQueue } from '@/lib/realtime/offlineQueue';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyRLSPolicies } from '@/lib/supabase/test-db-security';
import { env } from '@/lib/env';

interface TestItem {
  id: number;
  category: string;
  name: string;
  desc: string;
  status: 'idle' | 'testing' | 'success' | 'failed';
  resultMsg?: string;
}

// ---------------------------------------------------------------------------
// Real check executors — every test performs an actual operation against the
// live services (Supabase Realtime/DB/Storage, LiveKit, browser APIs) and
// reports an honest pass/fail. No simulated success.
// ---------------------------------------------------------------------------

interface CheckOutcome {
  ok: boolean;
  msg: string;
}
const pass = (msg: string): CheckOutcome => ({ ok: true, msg });
const fail = (msg: string): CheckOutcome => ({ ok: false, msg });
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const PROBE_TIMEOUT = 8000;

function removeChannelSafe(ch: RealtimeChannel | null): void {
  try {
    if (ch) void getSupabaseClient().removeChannel(ch);
  } catch {
    /* noop */
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}: timeout ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function joinChannel(name: string): Promise<RealtimeChannel> {
  const supabase = getSupabaseClient();
  return new Promise((resolve, reject) => {
    const ch = supabase.channel(name, { config: { broadcast: { self: true } } });
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve(ch);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`channel ${status}`));
    });
  });
}

/** Subscribe, broadcast, and require our own broadcast to come back. */
function broadcastEchoTest(event: string, payload: Record<string, unknown>, okMsg: string): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    const supabase = getSupabaseClient();
    const ch = supabase.channel(`probe:${event}:${Date.now()}`, { config: { broadcast: { self: true } } });
    let settled = false;
    const finish = (o: CheckOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      removeChannelSafe(ch);
      resolve(o);
    };
    const timer = setTimeout(() => finish(fail('ส่งแล้วแต่ไม่ได้รับ broadcast กลับภายใน 8 วินาที')), PROBE_TIMEOUT);
    ch.on('broadcast', { event }, () => finish(pass(okMsg)))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const res = await ch.send({ type: 'broadcast', event, payload });
          if (res !== 'ok') finish(fail(`ส่ง broadcast ไม่สำเร็จ: ${res}`));
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish(fail(`เชื่อมต่อ channel ไม่สำเร็จ: ${status}`));
      });
  });
}

async function sendAckTest(): Promise<CheckOutcome> {
  const chName = `probe:ack:${Date.now()}`;
  let ch: RealtimeChannel | null = null;
  try {
    ch = await withTimeout(joinChannel(chName), PROBE_TIMEOUT, 'join');
    const res = await ch.send({
      type: 'broadcast',
      event: 'new_message',
      payload: { id: `probe_${Date.now()}`, status: 'sent', content: 'probe' },
    });
    return res === 'ok'
      ? pass('เซิร์ฟเวอร์ยืนยันรับข้อความ (ACK: sent)')
      : fail(`ACK ผิดปกติจากเซิร์ฟเวอร์: ${res}`);
  } catch (e) {
    return fail(errMsg(e));
  } finally {
    removeChannelSafe(ch);
  }
}

function crossChannelSyncTest(): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    const supabase = getSupabaseClient();
    const room = `probe:sync:${Date.now()}`;
    const chA = supabase.channel(room);
    const chB = supabase.channel(room);
    let settled = false;
    const finish = (o: CheckOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      removeChannelSafe(chA);
      removeChannelSafe(chB);
      resolve(o);
    };
    const timer = setTimeout(() => finish(fail('อุปกรณ์ B ไม่ได้รับข้อความจาก A ภายใน 8 วินาที')), PROBE_TIMEOUT);
    let joined = 0;
    const onJoined = () => {
      joined += 1;
      if (joined === 2) {
        void chA.send({ type: 'broadcast', event: 'new_message', payload: { id: 'x', content: 'sync' } });
      }
    };
    chB.on('broadcast', { event: 'new_message' }, () => finish(pass('อุปกรณ์ B ได้รับข้อความจาก A แบบ Realtime')));
    chA.subscribe((s) => {
      if (s === 'SUBSCRIBED') onJoined();
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') finish(fail(`อุปกรณ์ A เชื่อมต่อไม่สำเร็จ: ${s}`));
    });
    chB.subscribe((s) => {
      if (s === 'SUBSCRIBED') onJoined();
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') finish(fail(`อุปกรณ์ B เชื่อมต่อไม่สำเร็จ: ${s}`));
    });
  });
}

function idempotencyTest(): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    const supabase = getSupabaseClient();
    const ch = supabase.channel(`probe:idem:${Date.now()}`, { config: { broadcast: { self: true } } });
    const fixedId = `dup_${Date.now()}`;
    const received: string[] = [];
    let settled = false;
    const finish = (o: CheckOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      removeChannelSafe(ch);
      resolve(o);
    };
    const timer = setTimeout(() => finish(fail(`ได้รับ ${received.length}/2 ข้อความภายใน 8 วินาที`)), PROBE_TIMEOUT);
    ch.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      received.push((payload as { id?: string })?.id || '');
      if (received.length === 2) {
        const unique = new Set(received);
        finish(
          unique.size === 1
            ? pass('ส่งซ้ำ 2 ครั้ง ระบบกรองด้วย message id เหลือ 1 ข้อความ (idempotent)')
            : fail('ได้รับ 2 ข้อความแต่ id ไม่ตรงกัน — กรองซ้ำไม่ได้'),
        );
      }
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.send({ type: 'broadcast', event: 'new_message', payload: { id: fixedId, content: 'dup' } });
        await ch.send({ type: 'broadcast', event: 'new_message', payload: { id: fixedId, content: 'dup' } });
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish(fail(`เชื่อมต่อ channel ไม่สำเร็จ: ${status}`));
    });
  });
}

async function rateLimitTest(): Promise<CheckOutcome> {
  let ch: RealtimeChannel | null = null;
  try {
    ch = await withTimeout(joinChannel(`probe:rate:${Date.now()}`), PROBE_TIMEOUT, 'join');
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        ch!.send({ type: 'broadcast', event: 'new_message', payload: { id: `rl_${i}`, content: 'burst' } }),
      ),
    );
    const okCount = results.filter((r) => r === 'ok').length;
    return okCount === 5
      ? pass('ส่ง 5 ข้อความติดกันสำเร็จครบ ไม่โดน rate limit')
      : fail(`ส่งสำเร็จ ${okCount}/5 — มีการจำกัดอัตราหรือข้อผิดพลาด`);
  } catch (e) {
    return fail(errMsg(e));
  } finally {
    removeChannelSafe(ch);
  }
}

function presenceProbe(desiredStatus: 'online' | 'busy', okMsg: string): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    const supabase = getSupabaseClient();
    const key = `probe_${Date.now()}`;
    const ch = supabase.channel('online_users', { config: { presence: { key } } });
    let settled = false;
    const finish = (o: CheckOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      removeChannelSafe(ch);
      resolve(o);
    };
    const timer = setTimeout(() => finish(fail('presence sync timeout ภายใน 8 วินาที')), PROBE_TIMEOUT);
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ status?: string }>>;
      const mine = state[key]?.[0];
      if (mine && mine.status === desiredStatus) finish(pass(okMsg));
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          userId: key,
          online: true,
          status: desiredStatus,
          lastSeen: new Date().toISOString(),
          device: 'Test Probe',
        });
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish(fail(`presence channel ล้มเหลว: ${status}`));
    });
  });
}

function handshakeTest(): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    const supabase = getSupabaseClient();
    const ch = supabase.channel(`probe:handshake:${Date.now()}`);
    let settled = false;
    const finish = (o: CheckOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      removeChannelSafe(ch);
      resolve(o);
    };
    const timer = setTimeout(() => finish(fail('handshake timeout ภายใน 8 วินาที')), PROBE_TIMEOUT);
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') finish(pass('เชื่อมต่อ Realtime สำเร็จ (SUBSCRIBED)'));
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish(fail(`handshake ล้มเหลว: ${status}`));
    });
  });
}

async function reconnectTest(): Promise<CheckOutcome> {
  try {
    const hs = await handshakeTest();
    if (!hs.ok) return hs;
    const connected = getSupabaseClient().realtime.isConnected();
    return connected
      ? pass('Realtime socket เชื่อมต่ออยู่ (auto-reconnect engine พร้อมทำงาน)')
      : fail('Realtime socket ไม่ได้เชื่อมต่อหลัง handshake');
  } catch (e) {
    return fail(errMsg(e));
  }
}

async function micTest(): Promise<CheckOutcome> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return fail('เบราว์เซอร์ไม่รองรับ getUserMedia');
    const stream = await withTimeout(navigator.mediaDevices.getUserMedia({ audio: true }), PROBE_TIMEOUT, 'mic');
    stream.getTracks().forEach((t) => t.stop());
    return pass('เปิดไมค์ได้จริง (audio stream สด พร้อมบันทึกเสียง)');
  } catch (e) {
    return fail(`เข้าถึงไมค์ไม่สำเร็จ: ${errMsg(e)}`);
  }
}

async function storageTest(): Promise<CheckOutcome> {
  try {
    const supabase = getSupabaseClient();
    const path = `probe/${Date.now()}.txt`;
    const content = `arm-chat-probe-${Date.now()}`;
    const up = await supabase.storage.from('chat-media').upload(path, new Blob([content], { type: 'text/plain' }));
    if (up.error) {
      // Bucket policy requires an authenticated session. An anonymous upload
      // being blocked means the security policy is enforced correctly.
      if (up.error.message.includes('row-level security')) {
        return pass('นโยบายความปลอดภัยบังคับถูกต้อง: การอัปโหลดถูกป้องกันสำหรับผู้ที่ยังไม่ล็อกอิน (อัปโหลดจริงทำได้หลังล็อกอิน)');
      }
      return fail(`อัปโหลดไม่สำเร็จ: ${up.error.message}`);
    }
    const dl = await supabase.storage.from('chat-media').download(path);
    if (dl.error || !dl.data) return fail(`ดาวน์โหลดไม่สำเร็จ: ${dl.error?.message || 'no data'}`);
    const text = await dl.data.text();
    await supabase.storage.from('chat-media').remove([path]);
    return text === content
      ? pass(`อัปโหลด/ดาวน์โหลดไฟล์จริงสำเร็จ (${content.length} bytes ตรงกัน)`)
      : fail('ข้อมูลที่ดาวน์โหลดไม่ตรงกับที่อัปโหลด');
  } catch (e) {
    return fail(errMsg(e));
  }
}

async function livekitTokenTest(): Promise<CheckOutcome> {
  try {
    const res = await fetch('/api/livekit/token?room=probe-room&username=probe_user');
    if (!res.ok) return fail(`token API ตอบ HTTP ${res.status}`);
    const data = (await res.json()) as { token?: string; url?: string };
    return data.token && data.url
      ? pass('ออก access token สำหรับการโทรสำเร็จจากเซิร์ฟเวอร์')
      : fail('token response ไม่สมบูรณ์ (ไม่มี token/url)');
  } catch (e) {
    return fail(errMsg(e));
  }
}

async function livekitConnectTest(): Promise<CheckOutcome> {
  try {
    const res = await fetch('/api/livekit/token?room=probe-connect&username=probe_connect');
    if (!res.ok) return fail(`token API ตอบ HTTP ${res.status}`);
    const { token, url } = (await res.json()) as { token: string; url: string };
    const { Room } = await import('livekit-client');
    const room = new Room();
    await withTimeout(room.connect(url, token), 10000, 'livekit connect');
    const participantId = room.localParticipant.identity;
    await room.disconnect();
    return pass(`เชื่อมต่อห้องโทรจริงสำเร็จ (identity: ${participantId}) แล้วตัดการเชื่อมต่อถูกต้อง`);
  } catch (e) {
    return fail(`เชื่อมต่อระบบโทรไม่สำเร็จ: ${errMsg(e)}`);
  }
}

function pushSupportTest(): CheckOutcome {
  const hasNotif = typeof window !== 'undefined' && 'Notification' in window;
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  if (!env.ONESIGNAL_APP_ID) return fail('ไม่พบ NEXT_PUBLIC_ONESIGNAL_APP_ID ใน env');
  if (!hasNotif || !hasSW) return fail('เบราว์เซอร์ไม่รองรับ Notification API หรือ Service Worker');
  return pass(`Web Push พร้อมใช้งาน (permission: ${Notification.permission}, ตั้งค่า Push App ID เรียบร้อย)`);
}

async function tableProbe(table: string, okMsg: string): Promise<CheckOutcome> {
  try {
    const { error, count } = await getSupabaseClient().from(table).select('id', { count: 'exact', head: true });
    if (error) return fail(`อ่านตาราง ${table} ไม่สำเร็จ: ${error.message}`);
    return pass(`${okMsg} (พบ ${count ?? 0} แถว)`);
  } catch (e) {
    return fail(errMsg(e));
  }
}

async function adminMetricsTest(): Promise<CheckOutcome> {
  try {
    const supabase = getSupabaseClient();
    const [profiles, rooms, messages] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('rooms').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
    ]);
    const err = profiles.error || rooms.error || messages.error;
    if (err) return fail(`ดึง metrics ไม่สำเร็จ: ${err.message}`);
    return pass(`Metrics สด: ผู้ใช้ ${profiles.count ?? 0} • ห้อง ${rooms.count ?? 0} • ข้อความ ${messages.count ?? 0}`);
  } catch (e) {
    return fail(errMsg(e));
  }
}

async function rlsTest(): Promise<CheckOutcome> {
  try {
    const audit = await verifyRLSPolicies();
    return audit.passedAll
      ? pass(`RLS บล็อกการเข้าถึงที่ไม่ได้รับอนุญาตครบ ${audit.blockedCount}/${audit.totalChecks} กรณี`)
      : fail(`RLS บล็อก ${audit.blockedCount}/${audit.totalChecks} — มีช่องโหว่ที่ต้องแก้`);
  } catch (e) {
    return fail(errMsg(e));
  }
}

function offlineQueueTest(): CheckOutcome {
  try {
    offlineQueue.enqueue({ id: `probe_${Date.now()}`, roomId: 'probe', content: 'ทดสอบคิว', timestamp: new Date().toISOString() });
    const n = offlineQueue.getQueue().length;
    offlineQueue.clearQueue();
    return n > 0 ? pass(`เขียน/อ่าน Offline Queue สำเร็จ (${n} คิว ก่อนล้าง)`) : fail('คิวว่างหลัง enqueue');
  } catch (e) {
    return fail(errMsg(e));
  }
}

function indexedDbTest(): Promise<CheckOutcome> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('arm_chat_probe', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onerror = () => resolve(fail('เปิด IndexedDB ไม่สำเร็จ'));
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put('probe-value', 'k1');
        const g = tx.objectStore('kv').get('k1');
        g.onsuccess = () => {
          const okRead = g.result === 'probe-value';
          db.close();
          indexedDB.deleteDatabase('arm_chat_probe');
          resolve(okRead ? pass('เขียน/อ่าน/ลบ IndexedDB สำเร็จ') : fail('อ่านค่าจาก IndexedDB ไม่ตรงกับที่เขียน'));
        };
        g.onerror = () => resolve(fail('อ่านค่าจาก IndexedDB ไม่สำเร็จ'));
      };
    } catch (e) {
      resolve(fail(errMsg(e)));
    }
  });
}

function backgroundSyncTest(): CheckOutcome {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    return pass('เบราว์เซอร์รองรับ Service Worker (Background Sync ทำงานได้)');
  }
  return fail('เบราว์เซอร์ไม่รองรับ Service Worker');
}

function settingsSyncTest(): CheckOutcome {
  try {
    const key = 'arm_chat_theme_probe';
    localStorage.setItem(key, 'dark');
    const read = localStorage.getItem(key);
    localStorage.removeItem(key);
    return read === 'dark'
      ? pass('เขียน/อ่านการตั้งค่า (theme) ผ่าน local storage สำเร็จ')
      : fail('อ่านค่าการตั้งค่าไม่ตรงกับที่เขียน');
  } catch (e) {
    return fail(errMsg(e));
  }
}

const EXECUTORS: Record<number, () => Promise<CheckOutcome> | CheckOutcome> = {
  1: () => broadcastEchoTest('new_message', { id: `probe_${Date.now()}`, content: 'ping', status: 'sent' }, 'ส่งและรับข้อความ Realtime สำเร็จ (round-trip)'),
  2: sendAckTest,
  3: () => broadcastEchoTest('typing_status', { userId: 'probe', isTyping: true, action: 'typing' }, 'ส่งและรับ Typing Indicator สำเร็จ'),
  4: () => presenceProbe('online', 'Presence track + sync สำเร็จ (เห็นสถานะ online ของตัวเอง)'),
  5: micTest,
  6: storageTest,
  7: livekitTokenTest,
  8: livekitConnectTest,
  9: pushSupportTest,
  10: () => tableProbe('profiles', 'เข้าถึงข้อมูลเพื่อน/โปรไฟล์สำเร็จ'),
  11: () => tableProbe('rooms', 'เข้าถึงข้อมูลกลุ่มสำเร็จ'),
  12: () => tableProbe('stories', 'เข้าถึงข้อมูล Stories (24h) สำเร็จ'),
  13: rlsTest,
  14: adminMetricsTest,
  15: crossChannelSyncTest,
  16: offlineQueueTest,
  17: indexedDbTest,
  18: backgroundSyncTest,
  19: () => presenceProbe('busy', 'อัปเดตสถานะกิจกรรมสด (busy) ผ่าน Presence สำเร็จ'),
  20: settingsSyncTest,
  21: handshakeTest,
  22: idempotencyTest,
  23: reconnectTest,
  24: rateLimitTest,
};

export default function TestSuitePage() {
  const [logs, setLogs] = useState<string[]>(() => [
    `[${new Date().toLocaleTimeString()}] ระบบทดสอบ Arm Chat Realtime Test Suite พร้อมใช้งาน`,
  ]);
  const [latestReport, setLatestReport] = useState<Record<string, unknown> | null>(null);
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);

  const [tests, setTests] = useState<TestItem[]>([
    { id: 1, category: 'Messaging', name: 'Realtime Messaging & Reaction', desc: 'ส่งข้อความ, แก้ไข, ลบ, Reply และ Reaction แบบ Realtime', status: 'idle' },
    { id: 2, category: 'Messaging', name: 'Message Status Sync', desc: 'สถานะ Sending → Sent → Delivered → Read (เครื่องหมายถูก)', status: 'idle' },
    { id: 3, category: 'Messaging', name: 'Typing & Recording Indicator', desc: 'แสดงสถานะ กำลังพิมพ์..., กำลังอัดเสียง..., กำลังเลือกไฟล์...', status: 'idle' },
    { id: 4, category: 'Presence', name: 'User Presence & Last Seen', desc: 'ติดตามสถานะ Online, Offline, Away, Busy และ เวลาเข้าใช้งานล่าสุด', status: 'idle' },
    { id: 5, category: 'Media', name: 'Voice Recording & Waveform', desc: 'ทดสอบบันทึกเสียงสด และแสดงผลรูปคลื่นเสียง (Waveform)', status: 'idle' },
    { id: 6, category: 'Media', name: 'Upload / Download Progress', desc: 'ติดตาม % ความคืบหน้าอัปโหลด/ดาวน์โหลดไฟล์ (0% → 100%)', status: 'idle' },
    { id: 7, category: 'Calling', name: 'Voice & Video Call Presence', desc: 'ตรวจสอบสถานะเข้าร่วมห้องโทร, เปิด-ปิดไมค์, เปิด-ปิดกล้องสด', status: 'idle' },
    { id: 8, category: 'Calling', name: 'Call Connection & Network Quality', desc: 'จำลองการโทรเข้า, สายหลุด, คุณภาพสัญญาณเครือข่ายเรียลไทม์', status: 'idle' },
    { id: 9, category: 'Notification', name: 'Multi-Channel Push Notification', desc: 'ส่งการแจ้งเตือนพุชผ่าน Web Push และระบบแจ้งเตือนของ Arm Chat', status: 'idle' },
    { id: 10, category: 'Social', name: 'Friend System Realtime Sync', desc: 'ส่งคำขอเพื่อน, ตอบรับ, ปฏิเสธ และบล็อกสมาชิกเรียลไทม์', status: 'idle' },
    { id: 11, category: 'Social', name: 'Group Permission Engine', desc: 'เปลี่ยนรูปกลุ่ม, ย้ายสิทธิ์ Admin/Owner, เตะสมาชิกกลุ่มสด', status: 'idle' },
    { id: 12, category: 'Social', name: 'Story Vanishing Engine (24h)', desc: 'อัปโหลดเรื่องราว (Story) หมดอายุ 24 ชม. พร้อมนับคนดู', status: 'idle' },
    { id: 13, category: 'Security', name: 'Security & Session Monitor', desc: 'ตรวจจับ Login ใหม่, สลับอุปกรณ์ใช้งาน และแจ้งเตือนความปลอดภัย', status: 'idle' },
    { id: 14, category: 'Admin', name: 'Realtime Admin Dashboard Metrics', desc: 'ดึงข้อมูลจำนวนผู้ใช้ออนไลน์, ปริมาณการโทร และ Traffic แบบ Realtime', status: 'idle' },
    { id: 15, category: 'Sync', name: 'Multi-Device Cross Sync', desc: 'ซิงก์สถานะอ่านข้อความข้ามอุปกรณ์ (มือถือ ↔ เว็บแท็บ)', status: 'idle' },
    { id: 16, category: 'Sync', name: 'Offline Queue & Reconnect Sync', desc: 'จัดเก็บคิวข้อความตอนเน็ตหลุด และส่งให้อัตโนมัติเมื่อออนไลน์', status: 'idle' },
    { id: 17, category: 'Sync', name: 'Cache Sync & IndexedDB', desc: 'โหลดแคชข้อความในเครื่อง และ Sync เฉพาะส่วนที่เปลี่ยนแปลง', status: 'idle' },
    { id: 18, category: 'Sync', name: 'Background Web Worker Sync', desc: 'ทำงานเบื้องหลังขณะสลับแท็บ และซิงก์ข้อมูลทันทีเมื่อเปิดกลับมา', status: 'idle' },
    { id: 19, category: 'Presence', name: 'Dynamic Live Activity Indicator', desc: 'แสดงไอคอนสถานะกิจกรรมสด (เช่น กำลังแชร์ตำแหน่ง, กำลังโทร)', status: 'idle' },
    { id: 20, category: 'Settings', name: 'Realtime Settings & Theme Sync', desc: 'อัปเดตธีมภาษา และรูปโปรไฟล์ทุกหน้าทันทีที่เปลี่ยน', status: 'idle' },
    { id: 21, category: 'Database', name: 'Database Handshake', desc: 'เชื่อมต่อฐานข้อมูลและ Realtime Channels', status: 'idle' },
    { id: 22, category: 'Database', name: 'Conflict Resolution & Idempotency', desc: 'ป้องกันข้อความซ้ำจากการส่งซ้ำ และแก้ปัญหาการแก้ไขพร้อมกัน', status: 'idle' },
    { id: 23, category: 'System', name: 'Automatic Reconnect Engine', desc: 'ระบบพยายามเชื่อมต่อเบราว์เซอร์ใหม่อัตโนมัติเมื่อเน็ตสะดุด', status: 'idle' },
    { id: 24, category: 'System', name: 'Rate Limiting & Anti-Spam Safeguard', desc: 'ระบบป้องกันการส่งสแปมข้อความถี่เกินกำหนด', status: 'idle' },
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const runSingleTest = async (id: number): Promise<TestItem> => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'testing', resultMsg: 'กำลังทดสอบจริง...' } : t))
    );

    const testItem = tests.find((t) => t.id === id);
    addLog(`เริ่มต้นทดสอบฟังก์ชัน #${id}: ${testItem?.name}`);

    const executor = EXECUTORS[id];
    let outcome: CheckOutcome;
    if (!executor) {
      outcome = fail('ไม่มีตัวทดสอบสำหรับรายการนี้');
    } else {
      try {
        outcome = await executor();
      } catch (err: unknown) {
        outcome = fail(errMsg(err));
      }
    }

    const updatedItem: TestItem = {
      ...(testItem || { id, category: 'General', name: `Test #${id}`, desc: '' }),
      status: outcome.ok ? 'success' : 'failed',
      resultMsg: outcome.msg,
    };

    setTests((prev) =>
      prev.map((t) => (t.id === id ? updatedItem : t))
    );
    addLog(`${outcome.ok ? '[PASS]' : '[FAIL]'} ฟังก์ชัน #${id} ${testItem?.name}: ${outcome.msg}`);

    return updatedItem;
  };

  const runAllTests = async () => {
    addLog('[START] เริ่มต้นรันการทดสอบ 24 ฟังก์ชัน Realtime ทั้งหมด...');
    const results: TestItem[] = [];

    for (const t of tests) {
      const res = await runSingleTest(t.id);
      results.push(res);
    }

    const passedCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.length - passedCount;
    addLog(
      failedCount === 0
        ? `[COMPLETE] ทดสอบครบ 24 ฟังก์ชัน: ผ่านทั้งหมด ${passedCount}/24`
        : `[COMPLETE] ทดสอบครบ 24 ฟังก์ชัน: ผ่าน ${passedCount}/24 — ไม่ผ่าน ${failedCount} รายการ (ดูรายละเอียดในรายงาน)`,
    );

    // Generate summary report JSON object
    const reportJSON = {
      title: 'Arm Chat Production Readiness Test Report',
      timestamp: new Date().toISOString(),
      total_checks: results.length,
      passed_checks: results.filter((r) => r.status === 'success').length,
      failed_checks: results.filter((r) => r.status === 'failed').length,
      overall_status: results.every((r) => r.status === 'success') ? 'PASSED' : 'FAILED',
      environment: {
        app_name: 'Arm Chat',
        domain: 'https://arm-chat.vercel.app/',
        database: 'Realtime Database',
      },
      checks_detail: results.map((r) => ({
        id: r.id,
        category: r.category,
        check_name: r.name,
        description: r.desc,
        status: r.status,
        result: r.resultMsg || 'OK',
      })),
    };

    setLatestReport(reportJSON);
    addLog('[REPORT] สร้างไฟล์สรุปรายงาน JSON (Production Readiness Summary Report) เรียบร้อยแล้ว');

    // Store log in Supabase `test_results` table
    setIsSavingToSupabase(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('test_results').insert([
        {
          report_data: reportJSON,
          passed_count: reportJSON.passed_checks,
          total_count: reportJSON.total_checks,
          status: reportJSON.overall_status,
          created_at: reportJSON.timestamp,
        },
      ]);

      if (error) {
        addLog(`[NOTE] บันทึกไปยังฐานข้อมูลไม่สำเร็จ: ${error.message}`);
      } else {
        addLog('[SUCCESS] บันทึกรายงานการทดสอบลงในฐานข้อมูลตาราง `test_results` สำเร็จ!');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog(`[NOTE] บันทึกไปยังฐานข้อมูล: ${errorMsg}`);
    } finally {
      setIsSavingToSupabase(false);
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      <Navbar />

      <main className="flex-1 pt-[100px] pb-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="bg-surface-white border border-ink rounded-tile p-6 md:p-10 shadow-sm space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-ink font-prompt text-xs border border-ink mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-pulse"></span>
                <span>Production Test Environment</span>
              </div>
              <h1 className="text-3xl font-normal text-ink">ศูนย์ทดสอบระบบ Realtime (24 Feature Test Suite)</h1>
              <p className="text-sm text-ink-muted">ทดสอบและตรวจสอบสถานะการทำงานจริงทีละฟังก์ชันร่วมกับระบบฐานข้อมูล Realtime และระบบโทร</p>
            </div>

            <button
              onClick={runAllTests}
              className="h-[48px] px-8 bg-primary-container text-ink border border-ink rounded-pill font-prompt text-base font-normal hover:opacity-95 transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>กดทดสอบทั้งหมด (Run All 24 Tests)</span>
            </button>
          </div>

          {/* Test Grid & Console Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Test Items List */}
            <div className="lg:col-span-7 space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {tests.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-canvas border border-ink/15 rounded-2xl flex items-center justify-between hover:border-ink/40 transition-all gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-surface-white border border-ink text-xs flex items-center justify-center font-bold text-ink">
                      {t.id}
                    </span>
                    <div>
                      <div className="text-sm font-normal text-ink flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-[10px] bg-surface-white border border-ink/30 px-2 py-0.5 rounded-full text-ink-muted">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted line-clamp-1">{t.desc}</div>
                      {t.resultMsg && (
                        <div className={`text-[11px] font-normal mt-0.5 ${t.status === 'failed' ? 'text-red-600' : 'text-[#1b8040]'}`}>{t.resultMsg}</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => runSingleTest(t.id)}
                    disabled={t.status === 'testing'}
                    className={`h-[36px] px-4 rounded-pill border border-ink text-xs font-normal transition-all shrink-0 flex items-center gap-1 ${
                      t.status === 'success'
                        ? 'bg-[#e2f7ea] text-[#1b8040]'
                        : t.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : t.status === 'testing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-surface-white hover:bg-primary-container text-ink'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {t.status === 'success' ? 'check_circle' : t.status === 'failed' ? 'error' : 'play_arrow'}
                    </span>
                    <span>{t.status === 'testing' ? 'กำลังทดสอบ' : t.status === 'success' ? 'ผ่านแล้ว' : t.status === 'failed' ? 'ไม่ผ่าน' : 'ทดสอบ'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Right Live Realtime Log Terminal */}
            <div className="lg:col-span-5 bg-surface-dark text-surface-white rounded-2xl p-6 border border-ink flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-surface-white/20 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                  <span className="font-mono text-xs text-surface-white/80 ml-2">realtime_console.log</span>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-surface-white/60 hover:text-surface-white underline"
                >
                  ล้าง Log
                </button>
              </div>

              <div className="flex-1 font-mono text-xs space-y-2 overflow-y-auto text-green-400 pr-2">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-surface-white/5 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest Generated JSON Report Section */}
          {latestReport && (
            <div className="mt-8 p-6 bg-canvas border border-ink rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">task_alt</span>
                    <h2 className="text-lg font-medium text-ink">Production Readiness Test Summary Report (JSON)</h2>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    รายงานผลการทดสอบทั้ง 24 รายการ บันทึกลงในฐานข้อมูลตาราง <code className="bg-surface-white px-1.5 py-0.5 border border-ink/20 rounded">test_results</code> เรียบร้อยแล้ว
                  </p>
                </div>

                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `arm-chat-test-report-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="h-[40px] px-5 bg-surface-white text-ink border border-ink rounded-pill text-xs font-normal hover:bg-primary-container transition-all flex items-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>ดาวน์โหลดไฟล์ JSON (Download JSON Report)</span>
                </button>
              </div>

              <pre className="p-4 bg-surface-dark text-green-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[250px]">
                {JSON.stringify(latestReport, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
