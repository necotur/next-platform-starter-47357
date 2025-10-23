
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getDownloadUrl } from '@/lib/s3';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan3D.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check access permissions
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

    // Update view count
    await prisma.treatmentPlan3D.update({
      where: { id: planId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    // Generate signed URLs for files
    const htmlUrl = plan.htmlFilePath ? await getDownloadUrl(plan.htmlFilePath) : null;
    const unitedModelUrl = plan.unitedModelPath ? await getDownloadUrl(plan.unitedModelPath) : null;
    const separateModelUrl = plan.separateModelPath ? await getDownloadUrl(plan.separateModelPath) : null;
    const pdfUrl = plan.pdfReportPath ? await getDownloadUrl(plan.pdfReportPath) : null;

    return NextResponse.json({
      plan: {
        ...plan,
        htmlUrl,
        unitedModelUrl,
        separateModelUrl,
        pdfUrl,
      },
    });

  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment plan' },
      { status: 500 }
    );
  }
}
