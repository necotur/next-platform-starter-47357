
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
      console.log('[FCM Unregister] No session found, skipping unregister');
      return NextResponse.json({ success: true, message: 'No session to unregister' });
    }

    const userId = (session.user as any).id;

    console.log('[FCM Unregister] Deleting all FCM tokens for user:', userId);

    // Delete all FCM tokens for this user
    const result = await prisma.fCMToken.deleteMany({
      where: {
        userId,
      },
    });

    console.log('[FCM Unregister] Deleted', result.count, 'FCM tokens for user:', userId);

    return NextResponse.json({ 
      success: true, 
      message: `Unregistered ${result.count} device(s)` 
    });
  } catch (error) {
    console.error('[FCM Unregister] Error unregistering FCM tokens:', error);
    return NextResponse.json(
      { error: 'Failed to unregister FCM tokens' },
      { status: 500 }
    );
  }
}
