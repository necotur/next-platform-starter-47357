
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    let plans;

    if (user.role === 'admin') {
      // Admin sees all plans
      plans = await prisma.treatmentPlan3D.findMany({
        where: patientId ? { patientId } : {},
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'doctor') {
      // Doctor sees plans for their patients
      const doctorPatients = await prisma.doctorPatient.findMany({
        where: { doctorId: user.id, status: 'active' },
        select: { patientId: true },
      });
      
      const patientIds = doctorPatients.map((dp: { patientId: string }) => dp.patientId);
      
      plans = await prisma.treatmentPlan3D.findMany({
        where: patientId 
          ? { patientId, AND: [{ patientId: { in: patientIds } }] }
          : { patientId: { in: patientIds } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Patient sees only their own plans
      plans = await prisma.treatmentPlan3D.findMany({
        where: { patientId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ plans });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment plans' },
      { status: 500 }
    );
  }
}
