
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { uploadFile } from '@/lib/s3';
import { checkAndUnlockAchievements } from '@/lib/check-achievements';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    const photos = await prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: [
        { alignerNumber: 'desc' },
        { capturedAt: 'desc' },
      ],
    });

    return NextResponse.json(photos ?? []);
  } catch (error) {
    console.error('Error fetching progress photos:', error);
    return NextResponse.json({ error: 'Failed to fetch progress photos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const alignerNumber = parseInt(formData.get('alignerNumber') as string);
    const photoType = formData.get('photoType') as string;

    if (!file || !alignerNumber || !photoType) {
      return NextResponse.json(
        { error: 'File, aligner number, and photo type are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `progress/${userId}/${alignerNumber}/${photoType}-${Date.now()}.jpg`;
    
    const cloudStoragePath = await uploadFile(buffer, fileName);

    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        alignerNumber,
        photoType,
        cloudStoragePath,
      },
    });

    // Check and unlock achievements after uploading photo
    await checkAndUnlockAchievements(userId);

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error uploading progress photo:', error);
    return NextResponse.json({ error: 'Failed to upload progress photo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    await prisma.progressPhoto.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
