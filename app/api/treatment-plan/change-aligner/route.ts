
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { userId },
    });

    if (!treatmentPlan) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    const now = new Date();
    const nextChange = new Date(now);
    nextChange.setDate(nextChange.getDate() + treatmentPlan.alignerChangeInterval);

    const updatedPlan = await prisma.treatmentPlan.update({
      where: { userId },
      data: {
        currentAlignerNumber: treatmentPlan.currentAlignerNumber + 1,
        lastAlignerChangeDate: now,
        nextAlignerChangeDate: nextChange,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error changing aligner:', error);
    return NextResponse.json({ error: 'Failed to change aligner' }, { status: 500 });
  }
}
