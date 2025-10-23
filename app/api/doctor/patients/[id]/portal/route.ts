

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update patient's 3D portal URL
export async function PUT(
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
    const { portalUrl } = await request.json();

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

    // Update the patient's portal URL
    const updatedPatient = await prisma.user.update({
      where: {
        id: patientId,
      },
      data: {
        smile3dPortalUrl: portalUrl || null,
      },
      select: {
        id: true,
        smile3dPortalUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      portalUrl: updatedPatient.smile3dPortalUrl,
    });
  } catch (error) {
    console.error('Error updating portal URL:', error);
    return NextResponse.json({ error: 'Failed to update portal URL' }, { status: 500 });
  }
}

