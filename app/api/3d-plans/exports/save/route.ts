
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, exportData, filename, description } = body;

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

    // Convert export data to JSON string
    const jsonContent = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFilename = filename || `export-${timestamp}.json`;
    const s3Key = `3d-exports/${planId}/${timestamp}-${safeFilename}`;

    // Upload to S3
    const filePath = await uploadFile(buffer, s3Key);

    // Count teeth with movements
    const movements = exportData.movements || [];
    const toothCount = movements.length;

    // Create export snapshot record
    const snapshot = await prisma.exportSnapshot.create({
      data: {
        planId,
        exportedById: user.id,
        exportedByRole: user.role,
        exportedByName: user.fullName || user.username,
        fileName: safeFilename,
        filePath,
        fileSize: buffer.length,
        description,
        toothCount,
      },
    });

    // Also save tooth movements to database (for backward compatibility)
    if (movements.length > 0) {
      // Clear existing movements for this plan from this user
      await prisma.toothMovement.deleteMany({
        where: { planId, savedById: user.id },
      });

      // Save new movements
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
      message: 'Export saved successfully',
      snapshot: {
        id: snapshot.id,
        fileName: snapshot.fileName,
        toothCount: snapshot.toothCount,
        createdAt: snapshot.createdAt,
      },
    });

  } catch (error) {
    console.error('Export save error:', error);
    return NextResponse.json(
      { error: 'Failed to save export' },
      { status: 500 }
    );
  }
}
