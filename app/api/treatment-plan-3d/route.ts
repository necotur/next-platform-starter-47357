
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch 3D treatment plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const patientId = searchParams.get('patientId');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (planId) {
      const plan = await prisma.treatmentPlan3D.findUnique({
        where: { id: planId },
        include: {
          toothMovements: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Check permissions
      if (user?.role === 'patient' && plan.patientId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (user?.role === 'doctor' && plan.doctorId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ plan }, { status: 200 });
    }

    // List plans based on user role
    let plans;
    if (user?.role === 'patient') {
      plans = await prisma.treatmentPlan3D.findMany({
        where: { patientId: userId },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user?.role === 'doctor') {
      if (patientId) {
        plans = await prisma.treatmentPlan3D.findMany({
          where: {
            patientId,
            doctorId: userId,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        plans = await prisma.treatmentPlan3D.findMany({
          where: { doctorId: userId },
          orderBy: { createdAt: 'desc' },
        });
      }
    } else {
      // Admin can see all
      plans = await prisma.treatmentPlan3D.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error('Error fetching 3D treatment plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment plans' },
      { status: 500 }
    );
  }
}

// POST: Create a new 3D treatment plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      patientId,
      patientName,
      doctorId,
      doctorName,
      unitedModelUrl,
      separateModelUrl,
      pdfReportUrl,
      portalUrl,
    } = body;

    if (!patientId || !patientName) {
      return NextResponse.json(
        { error: 'patientId and patientName are required' },
        { status: 400 }
      );
    }

    const plan = await prisma.treatmentPlan3D.create({
      data: {
        patientId,
        patientName,
        doctorId: doctorId || undefined,
        doctorName: doctorName || undefined,
        unitedModelPath: unitedModelUrl || undefined,
        separateModelPath: separateModelUrl || undefined,
        pdfReportPath: pdfReportUrl || undefined,
        status: 'published',
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating 3D treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to create treatment plan' },
      { status: 500 }
    );
  }
}

// PATCH: Update a 3D treatment plan
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const { planId, ...updateData } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan3D.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error('Error updating 3D treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to update treatment plan' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a 3D treatment plan
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 });
    }

    await prisma.treatmentPlan3D.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting 3D treatment plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete treatment plan' },
      { status: 500 }
    );
  }
}
