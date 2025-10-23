
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(req: NextRequest) {
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

    // Check access permissions - only the creator or admin can delete
    const user = await prisma.user.findUnique({ where: { id: (session!.user as any).id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canDelete = 
      user.role === 'admin' ||
      snapshot.exportedById === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete from S3
    try {
      await deleteFile(snapshot.filePath);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Continue anyway - we still want to delete the DB record
    }

    // Delete from database
    await prisma.exportSnapshot.delete({
      where: { id: snapshotId },
    });

    return NextResponse.json({
      success: true,
      message: 'Export snapshot deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting export snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete export snapshot' },
      { status: 500 }
    );
  }
}
