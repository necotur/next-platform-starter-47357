

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        clinicName: true,
        specialty: true,
        phoneNumber: true,
        licenseNumber: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'doctor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Not a doctor or admin' }, { status: 403 });
    }

    return NextResponse.json({
      clinicName: user.clinicName,
      specialty: user.specialty,
      phoneNumber: user.phoneNumber,
      licenseNumber: user.licenseNumber
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'doctor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Not a doctor or admin' }, { status: 403 });
    }

    const body = await request.json();
    const { clinicName, specialty, phoneNumber, licenseNumber } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        clinicName: clinicName || null,
        specialty: specialty || null,
        phoneNumber: phoneNumber || null,
        licenseNumber: licenseNumber || null
      }
    });

    return NextResponse.json({
      success: true,
      clinicName: updatedUser.clinicName,
      specialty: updatedUser.specialty,
      phoneNumber: updatedUser.phoneNumber,
      licenseNumber: updatedUser.licenseNumber
    });
  } catch (error) {
    console.error('Error updating doctor details:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor details' },
      { status: 500 }
    );
  }
}


