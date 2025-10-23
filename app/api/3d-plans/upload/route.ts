
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { modifyBlenderHTML, extractHtmlMetadata } from '@/lib/html-modifier';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can upload
    const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    
    const patientId = formData.get('patientId') as string;
    const patientName = formData.get('patientName') as string;
    const doctorName = formData.get('doctorName') as string;
    
    const htmlFile = formData.get('htmlFile') as File | null;
    const unitedModelFile = formData.get('unitedModel') as File | null;
    const separateModelFile = formData.get('separateModel') as File | null;
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!patientId || !patientName) {
      return NextResponse.json({ error: 'Patient ID and name required' }, { status: 400 });
    }

    if (!htmlFile) {
      return NextResponse.json({ error: 'HTML file required' }, { status: 400 });
    }

    // Upload files to S3
    const timestamp = Date.now();
    const planId = `plan-${patientId}-${timestamp}`;
    
    // Read and automatically modify the HTML file
    const originalHtmlContent = await htmlFile.text();
    const modifiedHtmlContent = modifyBlenderHTML(originalHtmlContent, planId);
    const metadata = extractHtmlMetadata(originalHtmlContent);
    
    console.log(`[Upload] Automatically modified HTML for plan ${planId}`);
    console.log(`[Upload] Extracted metadata:`, metadata);
    
    const htmlBuffer = Buffer.from(modifiedHtmlContent, 'utf-8');
    const htmlPath = await uploadFile(htmlBuffer, `3d-plans/${planId}/viewer.html`);

    let unitedModelPath: string | undefined;
    let separateModelPath: string | undefined;
    let pdfPath: string | undefined;

    if (unitedModelFile) {
      const buffer = Buffer.from(await unitedModelFile.arrayBuffer());
      unitedModelPath = await uploadFile(buffer, `3d-plans/${planId}/united.glb`);
    }

    if (separateModelFile) {
      const buffer = Buffer.from(await separateModelFile.arrayBuffer());
      separateModelPath = await uploadFile(buffer, `3d-plans/${planId}/separate.glb`);
    }

    if (pdfFile) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      pdfPath = await uploadFile(buffer, `3d-plans/${planId}/report.pdf`);
    }

    // Create treatment plan in database
    const plan = await prisma.treatmentPlan3D.create({
      data: {
        patientId,
        patientName,
        doctorName: doctorName || 'Dr. Unknown',
        htmlFilePath: htmlPath,
        unitedModelPath,
        separateModelPath,
        pdfReportPath: pdfPath,
        status: 'published',
      },
    });

    return NextResponse.json({ 
      success: true, 
      planId: plan.id,
      message: '3D treatment plan uploaded successfully' 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload 3D treatment plan' },
      { status: 500 }
    );
  }
}
