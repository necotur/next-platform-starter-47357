
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      );
    }

    console.log('[Web Push Subscribe] User ID:', userId);
    console.log('[Web Push Subscribe] Endpoint:', subscription.endpoint.substring(0, 50) + '...');

    // Check if subscription already exists
    const existing = await prisma.webPushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      console.log('[Web Push Subscribe] Subscription already exists, updating...');
      await prisma.webPushSubscription.update({
        where: { id: existing.id },
        data: {
          subscription: JSON.stringify(subscription),
          updatedAt: new Date(),
        },
      });
    } else {
      console.log('[Web Push Subscribe] Creating new subscription...');
      await prisma.webPushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          subscription: JSON.stringify(subscription),
        },
      });
    }

    console.log('[Web Push Subscribe] ✅ Subscription saved successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error: any) {
    console.error('[Web Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }

    await prisma.webPushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

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
