
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow unsubscribe even if no session (user is signing out)
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }

    console.log('[Web Push Unsubscribe] Deleting subscription with endpoint:', endpoint.substring(0, 50) + '...');

    if (session?.user) {
      const userId = (session.user as any).id;
      
      // Delete specific subscription for this user
      const result = await prisma.webPushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      });

      console.log('[Web Push Unsubscribe] Deleted', result.count, 'subscription(s) for user:', userId);
    } else {
      // If no session, delete by endpoint only
      const result = await prisma.webPushSubscription.deleteMany({
        where: {
          endpoint,
        },
      });

      console.log('[Web Push Unsubscribe] Deleted', result.count, 'subscription(s) by endpoint');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error: any) {
    console.error('[Web Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription: ' + error.message },
      { status: 500 }
    );
  }
}
