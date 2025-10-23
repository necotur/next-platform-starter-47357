
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get unread message counts grouped by sender
    const unreadCounts = await prisma.chatMessage.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: {
        id: true,
      },
    });

    // Convert to object for easier lookup
    const countsMap: Record<string, number> = {};
    unreadCounts.forEach((item: any) => {
      countsMap[item.senderId] = item._count.id;
    });

    // Get total unread count
    const totalUnread = unreadCounts.reduce((sum: any, item: any) => sum + item._count.id, 0);

    return NextResponse.json({ 
      countsMap,
      totalUnread,
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}
