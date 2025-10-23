
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { checkAndUnlockAchievements } from '@/lib/check-achievements';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.wearTimeLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(logs ?? []);
  } catch (error) {
    console.error('Error fetching wear time logs:', error);
    return NextResponse.json({ error: 'Failed to fetch wear time logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { date, hoursWorn } = body;

    if (hoursWorn === undefined) {
      return NextResponse.json({ error: 'Hours worn is required' }, { status: 400 });
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    const log = await prisma.wearTimeLog.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
      update: {
        hoursWorn,
      },
      create: {
        userId,
        date: logDate,
        hoursWorn,
      },
    });

    // Check and unlock achievements after logging wear time
    await checkAndUnlockAchievements(userId);

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error logging wear time:', error);
    return NextResponse.json({ error: 'Failed to log wear time' }, { status: 500 });
  }
}
