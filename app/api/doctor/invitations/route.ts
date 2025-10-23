
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode(): string {
  const bytes = randomBytes(4);
  const code = bytes.toString('hex').toUpperCase();
  return `SS-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized as doctor' }, { status: 403 });
    }

    const body = await request.json();
    const { inviteType, expiresIn } = body; // inviteType: 'link', 'code', 'qr'; expiresIn: number of days or null

    const inviteCode = generateInviteCode();
    let expiresAt = null;
    
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
    }

    const invitation = await prisma.doctorInvitation.create({
      data: {
        doctorId: doctor.id,
        inviteCode,
        inviteType: inviteType || 'code',
        expiresAt,
        maxUses: 1,
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        code: invitation.inviteCode,
        type: invitation.inviteType,
        expiresAt: invitation.expiresAt,
        inviteLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/connect?code=${invitation.inviteCode}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized as doctor' }, { status: 403 });
    }

    const rawInvitations = await prisma.doctorInvitation.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the invitations to match the expected format
    const invitations = rawInvitations.map((invitation: any) => ({
      id: invitation.id,
      code: invitation.inviteCode,
      type: invitation.inviteType,
      expiresAt: invitation.expiresAt,
      inviteLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/connect?code=${invitation.inviteCode}`,
    }));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
