'use client';

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeMessagePayload {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'poll' | 'reaction';
  mediaUrl?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp: string;
  replyToId?: string;
}

export interface TypingPayload {
  userId: string;
  roomId: string;
  isTyping: boolean;
  action?: 'typing' | 'recording' | 'selecting_file';
}

class RealtimeMessenger {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to room realtime channel
  subscribeToRoom(
    roomId: string,
    onMessage: (msg: RealtimeMessagePayload) => void,
    onTyping: (typing: TypingPayload) => void
  ) {
    if (this.channels.has(roomId)) {
      return this.channels.get(roomId);
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        onMessage(payload as RealtimeMessagePayload);
      })
      .on('broadcast', { event: 'typing_status' }, ({ payload }) => {
        onTyping(payload as TypingPayload);
      })
      .subscribe((status) => {
        console.log(`[RealtimeMessenger] Subscribed to room:${roomId} status:`, status);
      });

    this.channels.set(roomId, channel);
    return channel;
  }

  // Broadcast new message
  async sendMessage(roomId: string, message: RealtimeMessagePayload) {
    const channel = this.channels.get(roomId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });
    }
  }

  // Broadcast typing/recording indicator
  async sendTypingStatus(roomId: string, typing: TypingPayload) {
    const channel = this.channels.get(roomId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing_status',
        payload: typing,
      });
    }
  }

  // Unsubscribe from room
  unsubscribeRoom(roomId: string) {
    const channel = this.channels.get(roomId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(roomId);
    }
  }
}

export const realtimeMessenger = new RealtimeMessenger();
