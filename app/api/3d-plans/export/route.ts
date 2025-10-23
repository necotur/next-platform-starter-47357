
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, exportData } = body;

    if (!planId || !exportData) {
      return NextResponse.json({ error: 'Plan ID and export data required' }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan3D.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check access
    const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasAccess = 
      user.role === 'admin' ||
      plan.patientId === user.id ||
      (user.role === 'doctor' && await prisma.doctorPatient.findFirst({
        where: { doctorId: user.id, patientId: plan.patientId, status: 'active' }
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Save tooth movements
    const movements = exportData.movements || [];
    
    // Clear existing movements for this plan from this user
    await prisma.toothMovement.deleteMany({
      where: { planId, savedById: user.id },
    });

    // Save new movements
    if (movements.length > 0) {
      await prisma.toothMovement.createMany({
        data: movements.map((m: any) => ({
          planId,
          savedById: user.id,
          savedByRole: user.role,
          toothNumber: m.toothNumber || m.tooth,
          toothName: m.toothName || m.tooth,
          mesialDistal: parseFloat(m.mesialDistal || 0),
          buccalLingual: parseFloat(m.buccalLingual || 0),
          intrusionExtrusion: parseFloat(m.intrusionExtrusion || 0),
          tip: parseFloat(m.tip || 0),
          torque: parseFloat(m.torque || 0),
          rotation: parseFloat(m.rotation || 0),
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tooth movements saved successfully',
      count: movements.length,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to save tooth movements' },
      { status: 500 }
    );
  }
}
