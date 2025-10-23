
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
    const fileType = searchParams.get('type'); // 'united', 'separate', 'pdf'

    if (!planId || !fileType) {
      return NextResponse.json({ error: 'Plan ID and file type required' }, { status: 400 });
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

    // Get the appropriate file path
    let filePath: string | null = null;
    let contentType = 'application/octet-stream';

    switch (fileType) {
      case 'united':
        filePath = plan.unitedModelPath;
        contentType = 'model/gltf-binary';
        break;
      case 'separate':
        filePath = plan.separateModelPath;
        contentType = 'model/gltf-binary';
        break;
      case 'pdf':
        filePath = plan.pdfReportPath;
        contentType = 'application/pdf';
        break;
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate signed URL and redirect
    const signedUrl = await getDownloadUrl(filePath);
    
    // Return redirect to signed URL
    return NextResponse.redirect(signedUrl);

  } catch (error) {
    console.error('Proxy file error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}
