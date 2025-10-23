
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find FCM tokens for this user
    const tokens = await prisma.fCMToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const isRegistered = tokens.length > 0;
    const registeredAt = isRegistered ? tokens[0].createdAt : null;

    return NextResponse.json({
      isRegistered,
      registeredAt,
      tokenCount: tokens.length,
    });
  } catch (error: any) {
    console.error('Error checking FCM registration:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
