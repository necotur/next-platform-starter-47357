
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET: Fetch admin statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts
    const [totalUsers, totalPatients, totalDoctors, totalAdmins, totalConnections, totalPhotos, totalNotes] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'patient' } }),
      prisma.user.count({ where: { role: 'doctor' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.doctorPatient.count({ where: { status: 'active' } }),
      prisma.progressPhoto.count(),
      prisma.doctorNote.count(),
    ]);

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Get recent connections
    const recentConnections = await prisma.doctorPatient.findMany({
      take: 5,
      orderBy: { connectedAt: 'desc' },
      include: {
        doctor: {
          select: {
            fullName: true,
            email: true,
          },
        },
        patient: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAdmins,
        totalConnections,
        totalPhotos,
        totalNotes,
      },
      recentUsers,
      recentConnections,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
