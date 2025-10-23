

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all patients connected to this doctor
    const doctorPatients = await prisma.doctorPatient.findMany({
      where: {
        doctorId: userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            fullName: true,
            smile3dPortalUrl: true,
          },
        },
      },
      orderBy: {
        connectedAt: 'desc',
      },
    });

    // Transform the data to include patient info at the top level
    const patients = doctorPatients.map((dp: any) => ({
      id: dp.patient.id,
      email: dp.patient.email,
      fullName: dp.patient.fullName,
      smile3dPortalUrl: dp.patient.smile3dPortalUrl,
      connectedAt: dp.connectedAt,
      status: dp.status,
    }));

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
