
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET: Fetch all connections
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

    const connections = await prisma.doctorPatient.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST: Create a new connection between doctor and patient
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { doctorId, patientId } = body;

    if (!doctorId || !patientId) {
      return NextResponse.json({ error: 'Doctor ID and Patient ID are required' }, { status: 400 });
    }

    // Verify doctor exists and has doctor role
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    // Verify patient exists and has patient role
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    // Check if connection already exists
    const existingConnection = await prisma.doctorPatient.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 400 });
    }

    // Create the connection
    const connection = await prisma.doctorPatient.create({
      data: {
        doctorId,
        patientId,
        status: 'active',
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ connection, message: 'Connection created successfully' });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}

// DELETE: Remove a connection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    // Check if connection exists
    const connection = await prisma.doctorPatient.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Delete the connection
    await prisma.doctorPatient.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
