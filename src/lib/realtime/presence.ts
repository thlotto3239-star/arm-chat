'use client';

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresenceState {
  userId: string;
  online: boolean;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  device: string;
}

class RealtimePresence {
  private channel: RealtimeChannel | null = null;

  initPresence(userId: string, onPresenceChange: (presenceMap: Record<string, UserPresenceState>) => void) {
    if (this.channel) return;

    this.channel = supabase.channel('online_users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() || {};
        const presenceMap: Record<string, UserPresenceState> = {};

        Object.keys(state).forEach((key) => {
          const raw = state[key]?.[0];
          if (raw && typeof raw === 'object') {
            presenceMap[key] = raw as unknown as UserPresenceState;
          }
        });

        onPresenceChange(presenceMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({
            userId,
            online: true,
            status: 'online',
            lastSeen: new Date().toISOString(),
            device: 'Web Client',
          });
        }
      });
  }

  async updateStatus(userId: string, status: 'online' | 'away' | 'busy' | 'offline') {
    if (this.channel) {
      await this.channel.track({
        userId,
        online: status !== 'offline',
        status,
        lastSeen: new Date().toISOString(),
        device: 'Web Client',
      });
    }
  }

  leavePresence() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimePresence = new RealtimePresence();
