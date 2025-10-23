
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Helper function to convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPushNotifications() {
  const { data: session, status } = useSession() || {};
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    console.log('[Web Push] Hook initialized');
    
    // Check if service worker and push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    console.log('[Web Push] Support status:', supported);
    
    if (!supported) {
      console.log('[Web Push] Web Push not supported in this browser');
      return;
    }

    // Get current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('[Web Push] Current permission:', Notification.permission);
    }

    if (status !== 'authenticated' || !session?.user) {
      console.log('[Web Push] User not authenticated, skipping registration');
      return;
    }

    registerWebPush();
  }, [session, status]);

  const registerWebPush = async () => {
    try {
      console.log('[Web Push] Starting registration process...');

      // Register service worker
      console.log('[Web Push] Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      console.log('[Web Push] Service worker registered successfully');
      console.log('[Web Push] Scope:', registration.scope);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Web Push] Service worker ready');

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('[Web Push] ✅ Existing subscription found');
        console.log('[Web Push] Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        setIsSubscribed(true);
        
        // Send to server
        await sendSubscriptionToServer(subscription);
        return;
      }

      console.log('[Web Push] No existing subscription found');

      // Check permission
      if (Notification.permission === 'denied') {
        console.log('[Web Push] ⚠️ Notification permission denied');
        setError('Notification permission denied');
        return;
      }

      // Request permission if needed
      if (Notification.permission === 'default') {
        console.log('[Web Push] Requesting notification permission...');
        const permission = await Notification.requestPermission();
        setPermission(permission);
        console.log('[Web Push] Permission result:', permission);
        
        if (permission !== 'granted') {
          setError('Notification permission denied');
          return;
        }
      }

      // Subscribe to push notifications
      console.log('[Web Push] Creating push subscription...');
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[Web Push] ✅ Push subscription created');
      console.log('[Web Push] Endpoint:', subscription.endpoint.substring(0, 50) + '...');

      // Send subscription to server
      await sendSubscriptionToServer(subscription);
      
      setIsSubscribed(true);
      toast.success('Notifications enabled', {
        description: 'You will receive notifications for new messages',
      });

    } catch (error: any) {
      console.error('[Web Push] ❌ Error:', error);
      setError(error.message);
      toast.error('Notification setup failed', {
        description: error.message,
      });
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      console.log('[Web Push] Sending subscription to server...');
      
      const response = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        console.log('[Web Push] ✅ Subscription saved to server');
      } else {
        const error = await response.json();
        console.error('[Web Push] ❌ Failed to save subscription:', error);
      }
    } catch (error: any) {
      console.error('[Web Push] ❌ Error sending subscription to server:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Not supported', {
        description: 'Web Push notifications are not supported in this browser',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === 'granted') {
      await registerWebPush();
    } else {
      toast.error('Permission denied', {
        description: 'Please enable notifications in your browser settings',
      });
    }
  };

  return { 
    isSubscribed, 
    isSupported, 
    permission,
    error,
    requestPermission,
  };
}
