'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const appId = env.ONESIGNAL_APP_ID;
    if (!appId) {
      console.warn('Missing env NEXT_PUBLIC_ONESIGNAL_APP_ID. Push notifications disabled.');
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId,
        safari_web_id: 'web.onesignal.auto.arm-chat',
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, []);

  return (
    <script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      defer
    />
  );
}
