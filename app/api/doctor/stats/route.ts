

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total patients
    const totalPatients = await prisma.doctorPatient.count({
      where: {
        doctorId: userId,
      },
    });

    // Get active patients
    const activePatients = await prisma.doctorPatient.count({
      where: {
        doctorId: userId,
        status: 'active',
      },
    });

    // Get unread messages
    const unreadMessages = await prisma.chatMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    // Get recent activity (messages in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await prisma.chatMessage.count({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return NextResponse.json({
      totalPatients,
      activePatients,
      unreadMessages,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor stats' },
      { status: 500 }
    );
  }
}
