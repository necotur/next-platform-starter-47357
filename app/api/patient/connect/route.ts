
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Only patients can connect to doctors' }, { status: 403 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.doctorInvitation.findUnique({
      where: { inviteCode },
      include: { doctor: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    // Check if invitation has been used up
    if (invitation.currentUses >= invitation.maxUses) {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 });
    }

    // Check if already connected
    const existingConnection = await prisma.doctorPatient.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: invitation.doctorId,
          patientId: patient.id,
        },
      },
    });

    if (existingConnection && existingConnection.status === 'active') {
      return NextResponse.json({ error: 'You are already connected to this doctor' }, { status: 400 });
    }

    // Create or update the connection
    const connection = existingConnection
      ? await prisma.doctorPatient.update({
          where: { id: existingConnection.id },
          data: { status: 'active', connectedAt: new Date() },
          include: { doctor: true },
        })
      : await prisma.doctorPatient.create({
          data: {
            doctorId: invitation.doctorId,
            patientId: patient.id,
            status: 'active',
          },
          include: { doctor: true },
        });

    // Update invitation usage
    await prisma.doctorInvitation.update({
      where: { id: invitation.id },
      data: {
        currentUses: invitation.currentUses + 1,
        usedBy: patient.id,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      doctor: {
        id: connection.doctor.id,
        fullName: connection.doctor.fullName,
        specialty: connection.doctor.specialty,
        clinicName: connection.doctor.clinicName,
      },
    });
  } catch (error) {
    console.error('Error connecting to doctor:', error);
    return NextResponse.json(
      { error: 'Failed to connect to doctor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientDoctors: {
          where: { status: 'active' },
          include: { doctor: true },
        },
      },
    });

    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const connectedDoctor = patient.patientDoctors[0]?.doctor || null;

    return NextResponse.json({
      connected: !!connectedDoctor,
      doctor: connectedDoctor ? {
        id: connectedDoctor.id,
        fullName: connectedDoctor.fullName,
        specialty: connectedDoctor.specialty,
        clinicName: connectedDoctor.clinicName,
        email: connectedDoctor.email,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching doctor connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}
