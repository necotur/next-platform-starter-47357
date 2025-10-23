
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch tooth movements for a treatment plan
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

    if (!planId && !patientId) {
      return NextResponse.json(
        { error: 'planId or patientId required' },
        { status: 400 }
      );
    }

    let movements;

    if (planId) {
      movements = await prisma.toothMovement.findMany({
        where: { planId },
        include: {
          plan: {
            select: {
              patientName: true,
              doctorName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      movements = await prisma.toothMovement.findMany({
        where: {
          plan: { patientId: patientId! },
        },
        include: {
          plan: {
            select: {
              patientName: true,
              doctorName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ movements }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tooth movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tooth movements' },
      { status: 500 }
    );
  }
}

// POST: Save tooth movements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const body = await request.json();
    const { planId, movements, notes } = body;

    if (!planId || !movements || !Array.isArray(movements)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const plan = await prisma.treatmentPlan3D.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Delete existing movements for this plan by this user
    await prisma.toothMovement.deleteMany({
      where: {
        planId,
        savedById: userId,
      },
    });

    // Create new tooth movements
    const toothMovements = await prisma.toothMovement.createMany({
      data: movements.map((m: any) => ({
        planId,
        savedById: userId,
        savedByRole: user?.role || 'patient',
        toothNumber: m.toothNumber || m.tooth,
        toothName: m.toothName || m.tooth,
        mesialDistal: parseFloat(m.mesialDistal || m.md || 0),
        buccalLingual: parseFloat(m.buccalLingual || m.bl || 0),
        intrusionExtrusion: parseFloat(m.intrusionExtrusion || m.ie || 0),
        tip: parseFloat(m.tip || 0),
        torque: parseFloat(m.torque || 0),
        rotation: parseFloat(m.rotation || 0),
        notes: notes || m.notes || null,
      })),
    });

    return NextResponse.json(
      { success: true, count: toothMovements.count },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving tooth movements:', error);
    return NextResponse.json(
      { error: 'Failed to save tooth movements' },
      { status: 500 }
    );
  }
}

// DELETE: Clear tooth movements
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

    // Delete movements for this plan by this user
    const result = await prisma.toothMovement.deleteMany({
      where: {
        planId,
        savedById: userId,
      },
    });

    return NextResponse.json(
      { success: true, deletedCount: result.count },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tooth movements:', error);
    return NextResponse.json(
      { error: 'Failed to delete tooth movements' },
      { status: 500 }
    );
  }
}
