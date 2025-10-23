
'use client';

import { useEffect } from 'react';
import { useWebPushNotifications } from '@/hooks/use-web-push-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { isNativePlatform } from '@/lib/capacitor';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize Web Push (for PWA/browsers)
  const webPush = useWebPushNotifications();
  
  // Initialize FCM (for native apps)
  const fcm = usePushNotifications();

  useEffect(() => {
    console.log('[Notification Provider] Initialized');
    console.log('[Notification Provider] Platform:', isNativePlatform() ? 'Native' : 'Web');
    console.log('[Notification Provider] Web Push supported:', webPush.isSupported);
    console.log('[Notification Provider] Web Push subscribed:', webPush.isSubscribed);
  }, [webPush.isSupported, webPush.isSubscribed]);

  return <>{children}</>;
}
