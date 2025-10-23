
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      isSubscribed: subscriptions.length > 0,
      count: subscriptions.length,
      subscriptions: subscriptions.map((sub: any) => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        createdAt: sub.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Web Push Check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription: ' + error.message },
      { status: 500 }
    );
  }
}
