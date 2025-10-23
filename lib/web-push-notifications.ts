
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@seamlesssmile.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('[Web Push] VAPID keys configured successfully');
} else {
  console.warn('[Web Push] VAPID keys not configured');
}

export interface WebPushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  url?: string;
}

export interface WebPushNotificationResult {
  success: boolean;
  sent: number;
  total: number;
  results: Array<{
    success: boolean;
    subscription: string;
    error?: string;
  }>;
}

/**
 * Send Web Push notification to a user
 * This function can be called from anywhere in the backend
 */
export async function sendWebPushNotification(
  payload: WebPushNotificationPayload
): Promise<WebPushNotificationResult> {
  const { userId, title, body, data, url } = payload;

  console.log('[Web Push] ========== STARTING NOTIFICATION SEND ==========');
  console.log('[Web Push] User ID:', userId);
  console.log('[Web Push] Title:', title);
  console.log('[Web Push] Body:', body.substring(0, 100));

  try {
    // Get Web Push subscriptions for the user
    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { userId },
    });

    console.log('[Web Push] Found', subscriptions.length, 'subscription(s)');

    if (subscriptions.length === 0) {
      console.log('[Web Push] ⚠️ No subscriptions found for user:', userId);
      return {
        success: true,
        sent: 0,
        total: 0,
        results: [],
      };
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      data: data || {},
      url: url || '/',
    });

    console.log(`[Web Push] Preparing to send notification to ${subscriptions.length} subscription(s)`);

    // Send notifications to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub: any, index: any) => {
        try {
          console.log(`[Web Push] -------- Sending to subscription ${index + 1}/${subscriptions.length} --------`);
          
          const pushSubscription = JSON.parse(sub.subscription);
          
          await webpush.sendNotification(pushSubscription, notificationPayload);
          
          console.log('[Web Push] ✅ Successfully sent!');
          
          return {
            success: true,
            subscription: sub.endpoint.substring(0, 50) + '...',
          };
        } catch (error: any) {
          console.error('[Web Push] ❌ Failed to send notification');
          console.error('[Web Push] Error:', error.message);
          
          // If subscription is invalid or expired, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[Web Push] 🗑️ Subscription is invalid/expired. Deleting from database...');
            await prisma.webPushSubscription.delete({
              where: { id: sub.id },
            });
            console.log('[Web Push] ✅ Invalid subscription deleted');
          }
          
          return {
            success: false,
            subscription: sub.endpoint.substring(0, 50) + '...',
            error: error.message,
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;

    console.log('[Web Push] ========== NOTIFICATION SEND COMPLETE ==========');
    console.log(`[Web Push] 📊 Results: ${successCount}/${subscriptions.length} successful`);

    return {
      success: true,
      sent: successCount,
      total: subscriptions.length,
      results,
    };
  } catch (error: any) {
    console.error('[Web Push] ========== FATAL ERROR ==========');
    console.error('[Web Push] Error:', error.message);
    throw error;
  }
}
