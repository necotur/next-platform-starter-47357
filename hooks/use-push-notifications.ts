

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { isNativePlatform, getPlatform } from '@/lib/capacitor';
import { Device } from '@capacitor/device';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { data: session, status } = useSession() || {};
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Push Notifications] Hook initialized');
    console.log('[Push Notifications] Native platform:', isNativePlatform());
    console.log('[Push Notifications] Auth status:', status);
    console.log('[Push Notifications] Session:', session ? 'present' : 'absent');

    if (!isNativePlatform()) {
      console.log('[Push Notifications] Not a native platform, skipping registration');
      return;
    }

    if (status !== 'authenticated' || !session?.user) {
      console.log('[Push Notifications] User not authenticated, skipping registration');
      return;
    }

    const registerPushNotifications = async () => {
      try {
        console.log('[Push Notifications] Starting registration process...');

        // Request permission
        console.log('[Push Notifications] Checking permissions...');
        let permissionStatus = await FirebaseMessaging.checkPermissions();
        console.log('[Push Notifications] Current permission status:', permissionStatus);

        if (permissionStatus.receive === 'prompt') {
          console.log('[Push Notifications] Requesting permissions...');
          permissionStatus = await FirebaseMessaging.requestPermissions();
          console.log('[Push Notifications] Permission request result:', permissionStatus);
        }

        if (permissionStatus.receive !== 'granted') {
          const errorMsg = 'Push notification permission denied';
          setError(errorMsg);
          console.error('[Push Notifications]', errorMsg);
          toast.error('Notifications disabled', {
            description: 'You won\'t receive notifications for new messages',
          });
          return;
        }

        console.log('[Push Notifications] ✅ Permissions granted');

        // Get FCM token
        console.log('[Push Notifications] Getting FCM token...');
        const { token } = await FirebaseMessaging.getToken();
        console.log('[Push Notifications] ========== TOKEN RECEIVED ==========');
        console.log('[Push Notifications] Full token length:', token.length);
        console.log('[Push Notifications] Token preview:', token.substring(0, 50) + '...');

        // Get device info
        console.log('[Push Notifications] Getting device info...');
        const deviceInfo = await Device.getInfo();
        const deviceId = await Device.getId();

        const platform = getPlatform();
        const deviceInfoString = JSON.stringify({
          model: deviceInfo.model,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          manufacturer: deviceInfo.manufacturer,
          deviceId: deviceId.identifier,
        });

        console.log('[Push Notifications] Device info:', deviceInfoString);
        console.log('[Push Notifications] Platform:', platform);

        // Send token to server
        try {
          console.log('[Push Notifications] Sending token to server...');
          const response = await fetch('/api/fcm/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              platform,
              deviceInfo: deviceInfoString,
            }),
          });

          console.log('[Push Notifications] Server response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[Push Notifications] ✅ Token registered with server successfully');
            console.log('[Push Notifications] Server response:', data);
            setIsRegistered(true);
            toast.success('Notifications enabled', {
              description: 'You will receive notifications for new messages',
            });
          } else {
            const data = await response.json();
            console.error('[Push Notifications] ❌ Failed to register token with server:', data);
            setError('Failed to register token with server: ' + JSON.stringify(data));
            toast.error('Notification setup failed', {
              description: 'Could not register device for notifications',
            });
          }
        } catch (err: any) {
          console.error('[Push Notifications] ❌ Error sending token to server:', err);
          setError('Error sending token to server: ' + err.message);
          toast.error('Notification setup failed', {
            description: 'Network error while registering device',
          });
        }

        // Add listeners for incoming notifications
        console.log('[Push Notifications] Adding notification listeners...');

        await FirebaseMessaging.addListener('notificationReceived', (notification) => {
          console.log('[Push Notifications] 📬 Notification received while app is open:', {
            id: notification.notification.id,
            title: notification.notification.title,
            body: notification.notification.body,
            data: notification.notification.data,
          });

          // Show a toast notification
          toast.info(notification.notification.title || 'New message', {
            description: notification.notification.body,
          });
        });

        await FirebaseMessaging.addListener('notificationActionPerformed', (notification) => {
          console.log('[Push Notifications] 🔔 Notification tapped:', {
            actionId: notification.actionId,
            notification: notification.notification,
          });

          // Handle notification tap - navigate to chat if it's a chat message
          const data = notification.notification.data as any;
          if (data && data.type === 'chat_message' && data.senderId) {
            console.log('[Push Notifications] Navigating to chat with user:', data.senderId);
            window.location.href = `/chat?userId=${data.senderId}`;
          }
        });

        await FirebaseMessaging.addListener('tokenReceived', (event) => {
          console.log('[Push Notifications] 🔄 Token refreshed:', event.token.substring(0, 50) + '...');
          // TODO: Send updated token to server
        });

        console.log('[Push Notifications] ✅ All listeners registered successfully');

      } catch (error: any) {
        console.error('[Push Notifications] ❌ Fatal error:', error);
        console.error('[Push Notifications] Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        setError('Failed to set up push notifications: ' + error.message);
        toast.error('Notification setup failed', {
          description: error.message || 'An unexpected error occurred',
        });
      }
    };

    registerPushNotifications();

    // Cleanup
    return () => {
      console.log('[Push Notifications] Cleaning up listeners');
      FirebaseMessaging.removeAllListeners();
    };
  }, [session, status]);

  return { isRegistered, error };
}
