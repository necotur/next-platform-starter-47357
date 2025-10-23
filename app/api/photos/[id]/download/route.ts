
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { getDownloadUrl } from '@/lib/s3';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const photoId = params.id;

    const photo = await prisma.progressPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== userId) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const signedUrl = await getDownloadUrl(photo.cloudStoragePath);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error downloading photo:', error);
    return NextResponse.json({ error: 'Failed to download photo' }, { status: 500 });
  }
}
