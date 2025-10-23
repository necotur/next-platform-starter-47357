
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
    const snapshotId = searchParams.get('snapshotId');

    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID required' }, { status: 400 });
    }

    const snapshot = await prisma.exportSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        plan: true,
      },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Export snapshot not found' }, { status: 404 });
    }

    // Check access permissions
    const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasAccess = 
      user.role === 'admin' ||
      snapshot.plan.patientId === user.id ||
      (user.role === 'doctor' && await prisma.doctorPatient.findFirst({
        where: { doctorId: user.id, patientId: snapshot.plan.patientId, status: 'active' }
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate signed URL for the export file
    const fileUrl = await getDownloadUrl(snapshot.filePath);

    // Fetch the file content
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch export file');
    }

    const exportData = await response.json();

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        fileName: snapshot.fileName,
        description: snapshot.description,
        toothCount: snapshot.toothCount,
        exportedByName: snapshot.exportedByName,
        createdAt: snapshot.createdAt,
      },
      exportData,
    });

  } catch (error) {
    console.error('Error fetching export snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export snapshot' },
      { status: 500 }
    );
  }
}
