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

      let recipientIds: string[] = [];

      if (members && members.length > 0) {
        const now = new Date();
        const activeRecipients = members.filter(m => {
          if (m.muted_until && new Date(m.muted_until) > now) return false;
          return true;
        });
        recipientIds = activeRecipients.map(m => m.user_id);
      } else {
        // Fallback: Notify all active profiles except sender if room members table has no specific entries
        const { data: allProfiles } = await supabaseService
          .from('profiles')
          .select('id')
          .neq('id', record.sender_id);

        recipientIds = allProfiles?.map(p => p.id) || [];
      }

      if (recipientIds.length === 0) {
        return NextResponse.json({ message: 'No recipients found' }, { status: 200 });
      }

      // Fetch sender profile
      const { data: sender } = await supabaseService
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', record.sender_id)
        .single();

      const senderName = sender?.display_name || 'เพื่อน';
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

      // Fetch target user device tokens / player IDs from user_devices table
      const { data: userDevices } = await supabaseService
        .from('user_devices')
        .select('onesignal_player_id, device_token')
        .in('user_id', recipientIds);

      const playerIds = userDevices
        ?.map(d => d.onesignal_player_id || d.device_token)
        .filter(Boolean) as string[] || [];

      // Send OneSignal Push Notification
      const oneSignalAppId = env.ONESIGNAL_APP_ID;
      const oneSignalRestKey = env.ONESIGNAL_REST_API_KEY;
      const appUrl = env.APP_URL;

      if (oneSignalAppId && oneSignalRestKey && appUrl) {
        const payload: Record<string, any> = {
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
        };

        if (playerIds.length > 0) {
          payload.include_player_ids = playerIds;
        }

        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Basic ${oneSignalRestKey}`
          },
          body: JSON.stringify(payload)
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
