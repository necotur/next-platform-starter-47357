

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'doctor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const patientId = params.id;

    // Verify the doctor has access to this patient (admins have access to all patients)
    if (user.role === 'doctor') {
      const connection = await prisma.doctorPatient.findFirst({
        where: {
          doctorId: user.id,
          patientId: patientId,
          status: 'active',
        },
      });

      if (!connection) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
    }

    // Fetch all patient data
    const [wearTimeLogs, symptomLogs, progressPhotos, achievements, treatmentPlan] = await Promise.all([
      // Wear time logs (last 30 days)
      prisma.wearTimeLog.findMany({
        where: {
          userId: patientId,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      
      // Symptom logs (last 30 days)
      prisma.symptomLog.findMany({
        where: {
          userId: patientId,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      
      // Progress photos
      prisma.progressPhoto.findMany({
        where: {
          userId: patientId,
        },
        orderBy: {
          capturedAt: 'desc',
        },
      }),
      
      // Achievements
      prisma.userAchievement.findMany({
        where: {
          userId: patientId,
        },
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      }),
      
      // Treatment plan
      prisma.treatmentPlan.findUnique({
        where: {
          userId: patientId,
        },
      }),
    ]);

    return NextResponse.json({
      wearTimeLogs,
      symptomLogs,
      progressPhotos,
      achievements,
      treatmentPlan,
    });
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 });
  }
}

