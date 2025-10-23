
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getExistingSubscription,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/push-notifications';
import { Bell, BellOff } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function NotificationManager() {
  const { data: session } = useSession() || {};
  const { t } = useLanguage();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const subscription = await getExistingSubscription();
    setIsSubscribed(!!subscription);
  };

  const handleToggleNotifications = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      if (isSubscribed) {
        // Get subscription before unsubscribing
        const subscription = await getExistingSubscription();
        
        // Unsubscribe from push notifications
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          // Delete from server if subscription existed
          if (subscription) {
            await fetch(
              `/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
              { method: 'DELETE' }
            );
          }
        }
        
        // Re-check subscription status after unsubscribing
        await checkSubscription();
      } else {
        // Subscribe to push notifications
        const subscriptionData = await subscribeToPushNotifications();
        if (subscriptionData) {
          // Save to server
          const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: subscriptionData.endpoint,
              p256dh: subscriptionData.keys.p256dh,
              auth: subscriptionData.keys.auth,
            }),
          });

          if (response.ok) {
            // Re-check subscription status after subscribing
            await checkSubscription();
          }
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // Re-check subscription status after error
      await checkSubscription();
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return null;
  }

  const permission = getNotificationPermission();
  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t.settings.notificationsDisabled}
            </p>
            <p className="text-xs text-gray-500">
              {t.settings.allowNotifications}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5" style={{ color: '#AF4B6C' }} />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isSubscribed
              ? t.settings.notificationsEnabled
              : t.settings.notificationsDisabled}
          </p>
          <p className="text-xs text-gray-500">{t.settings.chatMessages}</p>
        </div>
      </div>

      <button
        onClick={handleToggleNotifications}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
          isSubscribed ? 'bg-[#AF4B6C]' : 'bg-gray-200'
        }`}
        style={isSubscribed ? { backgroundColor: '#AF4B6C' } : {}}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isSubscribed ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
