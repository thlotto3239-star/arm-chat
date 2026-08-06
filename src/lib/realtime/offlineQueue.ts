'use client';

export interface PendingOfflineMessage {
  id: string;
  roomId: string;
  content: string;
  timestamp: string;
}

class OfflineQueueManager {
  private STORAGE_KEY = 'arm_chat_pending_queue';

  getQueue(): PendingOfflineMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  enqueue(message: PendingOfflineMessage) {
    const queue = this.getQueue();
    queue.push(message);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }
  }

  clearQueue() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const offlineQueue = new OfflineQueueManager();
