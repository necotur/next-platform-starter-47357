
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
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const symptoms = await prisma.symptomLog.findMany({
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

    return NextResponse.json(symptoms ?? []);
  } catch (error) {
    console.error('Error fetching symptom logs:', error);
    return NextResponse.json({ error: 'Failed to fetch symptom logs' }, { status: 500 });
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
    const { symptomType, severity, notes } = body;

    if (!symptomType || !severity) {
      return NextResponse.json(
        { error: 'Symptom type and severity are required' },
        { status: 400 }
      );
    }

    const symptom = await prisma.symptomLog.create({
      data: {
        userId,
        symptomType,
        severity,
        notes: notes || null,
      },
    });

    return NextResponse.json(symptom);
  } catch (error) {
    console.error('Error logging symptom:', error);
    return NextResponse.json({ error: 'Failed to log symptom' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Symptom ID is required' }, { status: 400 });
    }

    await prisma.symptomLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting symptom:', error);
    return NextResponse.json({ error: 'Failed to delete symptom' }, { status: 500 });
  }
}
