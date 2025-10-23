
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'doctor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const patientId = params.id;
    const { validityHours = 24 } = await request.json();

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, username: true, fullName: true, role: true },
    });

    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Generate a secure random password
    const oneTimePassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(oneTimePassword, 10);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validityHours);

    // Update patient with one-time password
    await prisma.user.update({
      where: { id: patientId },
      data: {
        oneTimePassword: hashedPassword,
        oneTimePasswordUsed: false,
        oneTimePasswordExpires: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      credentials: {
        username: patient.username,
        password: oneTimePassword,
        fullName: patient.fullName,
        expiresAt: expiresAt.toISOString(),
        validityHours,
      },
    });
  } catch (error) {
    console.error('Error generating one-time login:', error);
    return NextResponse.json(
      { error: 'Failed to generate one-time login credentials' },
      { status: 500 }
    );
  }
}

function generateSecurePassword(): string {
  // Generate a simple 4-digit code
  return Math.floor(1000 + Math.random() * 9000).toString();
}
