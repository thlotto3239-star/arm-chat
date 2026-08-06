import { supabase } from '@/lib/supabase/client';

export interface NotificationPayload {
  userId: string;
  type: 'chat' | 'friend_request' | 'friend_accepted' | 'system' | 'story' | 'call';
  title: string;
  body: string;
  deepLink: string;
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification({ userId, type, title, body, deepLink }: NotificationPayload) {
  try {
    const { error } = await supabase.from('notifications_history').insert({
      user_id: userId,
      type,
      title,
      body,
      deep_link: deepLink,
      is_read: false,
    });
    if (error) {
      console.warn('sendNotification warning:', error.message);
    }
  } catch (err) {
    console.warn('sendNotification error:', err);
  }
}

/**
 * Notify all members of a chat room except the sender
 */
export async function notifyRoomMembers({
  roomId,
  senderId,
  senderName,
  content,
  type = 'text',
}: {
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
}) {
  try {
    const { data: members } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId)
      .neq('user_id', senderId);

    if (!members || members.length === 0) return;

    const bodyText =
      type === 'image'
        ? '📷 [รูปภาพใหม่]'
        : type === 'audio'
        ? '🎙️ [ข้อความเสียง]'
        : type === 'file'
        ? '📎 [ไฟล์แนบ]'
        : content;

    const rows = members.map((m) => ({
      user_id: m.user_id,
      type: 'chat',
      title: senderName || 'ข้อความใหม่',
      body: bodyText,
      deep_link: `/chat/${roomId}`,
      is_read: false,
    }));

    await supabase.from('notifications_history').insert(rows);
  } catch (err) {
    console.warn('notifyRoomMembers error:', err);
  }
}

/**
 * Notify user about a friend request
 */
export async function notifyFriendRequest(targetUserId: string, senderName: string) {
  await sendNotification({
    userId: targetUserId,
    type: 'friend_request',
    title: '👋 คำขอเป็นเพื่อนใหม่',
    body: `${senderName} ได้ส่งคำขอเป็นเพื่อนถึงคุณ`,
    deepLink: '/friends/add',
  });
}

/**
 * Notify user about friend request acceptance
 */
export async function notifyFriendAccepted(targetUserId: string, acceptorName: string) {
  await sendNotification({
    userId: targetUserId,
    type: 'friend_accepted',
    title: '🎉 ยอมรับคำขอเป็นเพื่อนแล้ว',
    body: `${acceptorName} ได้ยอมรับคำขอเป็นเพื่อนของคุณแล้ว`,
    deepLink: '/chats',
  });
}

/**
 * Notify user about system announcement or other activity
 */
export async function notifySystemAlert(userId: string, title: string, body: string, deepLink = '/chats') {
  await sendNotification({
    userId,
    type: 'system',
    title,
    body,
    deepLink,
  });
}
