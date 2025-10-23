
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { userId },
    });

    return NextResponse.json(treatmentPlan ?? {});
  } catch (error) {
    console.error('Error fetching treatment plan:', error);
    return NextResponse.json({ error: 'Failed to fetch treatment plan' }, { status: 500 });
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
    
    const { startDate, totalAligners, alignerChangeInterval, dailyWearTimeGoal } = body;

    if (!startDate || !totalAligners || !alignerChangeInterval) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const nextChange = new Date(start);
    nextChange.setDate(nextChange.getDate() + alignerChangeInterval);

    const treatmentPlan = await prisma.treatmentPlan.upsert({
      where: { userId },
      update: {
        startDate: start,
        totalAligners,
        alignerChangeInterval,
        dailyWearTimeGoal: dailyWearTimeGoal || 22,
        lastAlignerChangeDate: start,
        nextAlignerChangeDate: nextChange,
      },
      create: {
        userId,
        startDate: start,
        totalAligners,
        alignerChangeInterval,
        dailyWearTimeGoal: dailyWearTimeGoal || 22,
        lastAlignerChangeDate: start,
        nextAlignerChangeDate: nextChange,
      },
    });

    return NextResponse.json(treatmentPlan);
  } catch (error) {
    console.error('Error creating/updating treatment plan:', error);
    return NextResponse.json({ error: 'Failed to save treatment plan' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const treatmentPlan = await prisma.treatmentPlan.update({
      where: { userId },
      data: body,
    });

    return NextResponse.json(treatmentPlan);
  } catch (error) {
    console.error('Error updating treatment plan:', error);
    return NextResponse.json({ error: 'Failed to update treatment plan' }, { status: 500 });
  }
}
