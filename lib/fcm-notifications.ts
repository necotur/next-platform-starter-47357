
import { PrismaClient } from '@prisma/client';
import { getMessaging, isFirebaseConfigured } from './firebase-admin';

const prisma = new PrismaClient();

export interface FCMNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FCMNotificationResult {
  success: boolean;
  sent: number;
  total: number;
  results: Array<{
    success: boolean;
    token: string;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Send FCM push notification to a user
 * This function can be called from anywhere in the backend
 */
export async function sendFCMNotification(
  payload: FCMNotificationPayload
): Promise<FCMNotificationResult> {
  const { userId, title, body, data } = payload;

  console.log('[FCM] ========== STARTING NOTIFICATION SEND ==========');
  console.log('[FCM] User ID:', userId);
  console.log('[FCM] Title:', title);
  console.log('[FCM] Body:', body.substring(0, 100));
  console.log('[FCM] Data:', JSON.stringify(data));

  try {
    // Get FCM tokens for the user
    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
    });

    console.log('[FCM] Database query complete. Found', tokens.length, 'token(s)');
    
    if (tokens.length > 0) {
      tokens.forEach((t: any, idx: any) => {
        console.log(`[FCM] Token ${idx + 1}:`, {
          id: t.id,
          platform: t.platform,
          token: t.token.substring(0, 30) + '...',
          createdAt: t.createdAt,
        });
      });
    }

    if (tokens.length === 0) {
      console.log('[FCM] ⚠️ No tokens found for user:', userId);
      return {
        success: true,
        sent: 0,
        total: 0,
        results: [],
      };
    }

    // Check if Firebase Admin SDK is configured
    console.log('[FCM] Checking Firebase configuration...');
    if (!isFirebaseConfigured()) {
      console.error('[FCM] ❌ Firebase Admin SDK not configured');
      throw new Error('Firebase Admin SDK not configured');
    }
    console.log('[FCM] ✅ Firebase Admin SDK is configured');

    // Get Firebase Messaging instance
    console.log('[FCM] Getting Firebase Messaging instance...');
    const messaging = getMessaging();
    console.log('[FCM] ✅ Firebase Messaging instance obtained');

    console.log(`[FCM] Preparing to send notification to ${tokens.length} device(s)`);

    // Send notifications to all tokens
    const results = await Promise.all(
      tokens.map(async (tokenDoc: any, index: any) => {
        try {
          console.log(`[FCM] -------- Sending to device ${index + 1}/${tokens.length} --------`);
          console.log('[FCM] Token:', tokenDoc.token.substring(0, 30) + '...');
          console.log('[FCM] Platform:', tokenDoc.platform);
          
          const message = {
            notification: {
              title,
              body,
            },
            data: data || {},
            token: tokenDoc.token,
            android: {
              notification: {
                icon: 'ic_notification',
                color: '#AF4B6C',
                sound: 'default',
                channelId: 'default',
                priority: 'high' as const,
              },
              priority: 'high' as const,
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true,
                },
              },
            },
          };

          console.log('[FCM] Message prepared:', JSON.stringify({
            ...message,
            token: message.token.substring(0, 30) + '...',
          }, null, 2));
          
          console.log('[FCM] Calling messaging.send()...');
          const messageId = await messaging.send(message);
          console.log('[FCM] ✅ Successfully sent! MessageID:', messageId);
          
          return { 
            success: true, 
            token: tokenDoc.token.substring(0, 30) + '...', 
            messageId 
          };
        } catch (error: any) {
          console.error('[FCM] ❌ Failed to send notification');
          console.error('[FCM] Error message:', error.message);
          console.error('[FCM] Error code:', error.code);
          console.error('[FCM] Error stack:', error.stack);
          
          // If token is invalid or expired, delete it
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            console.log('[FCM] 🗑️ Token is invalid/expired. Deleting from database...');
            await prisma.fCMToken.delete({
              where: { id: tokenDoc.id },
            });
            console.log('[FCM] ✅ Invalid token deleted');
          }
          
          return { 
            success: false, 
            token: tokenDoc.token.substring(0, 30) + '...', 
            error: error.message 
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;

    console.log('[FCM] ========== NOTIFICATION SEND COMPLETE ==========');
    console.log(`[FCM] 📊 Results: ${successCount}/${tokens.length} successful`);
    console.log('[FCM] Details:', JSON.stringify(results, null, 2));

    return {
      success: true,
      sent: successCount,
      total: tokens.length,
      results,
    };
  } catch (error: any) {
    console.error('[FCM] ========== FATAL ERROR ==========');
    console.error('[FCM] Error:', error.message);
    console.error('[FCM] Stack:', error.stack);
    throw error;
  }
}
