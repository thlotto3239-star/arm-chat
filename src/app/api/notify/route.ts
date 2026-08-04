import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

let supabaseService: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (supabaseService) return supabaseService;
  supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  return supabaseService;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseService = getServiceClient();
    const payload = await request.json();
    const eventType = payload.type || 'INSERT';

    // Handle Messages Webhook Event
    if (eventType === 'INSERT' && payload.table === 'messages') {
      const record = payload.record;
      if (!record || !record.room_id || !record.sender_id) {
        return NextResponse.json({ error: 'Invalid record format' }, { status: 400 });
      }

      // Fetch room members
      const { data: members } = await supabaseService
        .from('room_members')
        .select('user_id, muted_until')
        .eq('room_id', record.room_id)
        .neq('user_id', record.sender_id);

      if (!members || members.length === 0) {
        return NextResponse.json({ message: 'No recipients' }, { status: 200 });
      }

      // Fetch sender profile
      const { data: sender } = await supabaseService
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', record.sender_id)
        .single();

      const senderName = sender?.display_name || 'เพื่อน';

      // Filter out muted members
      const now = new Date();
      const activeRecipients = members.filter(m => {
        if (m.muted_until && new Date(m.muted_until) > now) return false;
        return true;
      });

      if (activeRecipients.length === 0) {
        return NextResponse.json({ message: 'All recipients muted' }, { status: 200 });
      }

      const recipientIds = activeRecipients.map(m => m.user_id);
      const contentText = record.type === 'text' ? record.content : record.type === 'image' ? '[รูปภาพใหม่]' : '[ไฟล์แนบใหม่]';
      const deepLink = `/chat/${record.room_id}`;

      // Insert Notification into Notification Center History Table
      for (const uid of recipientIds) {
        await supabaseService.from('notifications_history').insert({
          user_id: uid,
          type: 'chat',
          title: senderName,
          body: contentText,
          deep_link: deepLink
        });
      }

      // Send OneSignal Push Notification
      const oneSignalAppId = env.ONESIGNAL_APP_ID;
      const oneSignalRestKey = env.ONESIGNAL_REST_API_KEY;
      const appUrl = env.APP_URL;

      if (oneSignalAppId && oneSignalRestKey && appUrl) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Basic ${oneSignalRestKey}`
          },
          body: JSON.stringify({
            app_id: oneSignalAppId,
            include_aliases: { external_id: recipientIds },
            target_channel: 'push',
            headings: {
              en: senderName,
              th: senderName,
              zh: senderName,
              ja: senderName
            },
            contents: {
              en: contentText,
              th: contentText,
              zh: contentText,
              ja: contentText
            },
            url: `${appUrl}${deepLink}`
          })
        });
      }

      return NextResponse.json({ success: true, notified: recipientIds });
    }

    return NextResponse.json({ message: 'Event processed' }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
