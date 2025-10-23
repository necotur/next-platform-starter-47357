
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { sendFCMNotification } from '@/lib/fcm-notifications';
import { isFirebaseConfigured, getMessaging } from '@/lib/firebase-admin';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Diagnostic information
    const diagnostics: any = {
      userId,
      firebaseConfigured: isFirebaseConfigured(),
      timestamp: new Date().toISOString(),
    };

    // Check if Firebase is configured
    if (!diagnostics.firebaseConfigured) {
      return NextResponse.json({
        error: 'Firebase Admin SDK not configured',
        diagnostics,
      }, { status: 500 });
    }

    // Get FCM tokens for user
    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
    });

    diagnostics.tokens = {
      count: tokens.length,
      tokens: tokens.map((t: any) => ({
        id: t.id,
        platform: t.platform,
        token: t.token.substring(0, 20) + '...',
        createdAt: t.createdAt,
      })),
    };

    if (tokens.length === 0) {
      return NextResponse.json({
        error: 'No FCM tokens found for user. Please make sure the app is installed and you\'re logged in.',
        diagnostics,
      }, { status: 404 });
    }

    // Try to send a test notification
    console.log('[Test Notification] Attempting to send test notification to user:', userId);
    
    try {
      const result = await sendFCMNotification({
        userId,
        title: 'Test Notification',
        body: 'This is a test notification from Seamless Smile Tracker',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      });

      diagnostics.notificationResult = result;

      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
        diagnostics,
      });
    } catch (notificationError: any) {
      console.error('[Test Notification] Error sending notification:', notificationError);
      diagnostics.notificationError = {
        message: notificationError.message,
        code: notificationError.code,
        stack: notificationError.stack,
      };

      return NextResponse.json({
        error: 'Failed to send test notification',
        diagnostics,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Test Notification] Error:', error);
    return NextResponse.json({
      error: 'Test notification failed',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
