
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET: Fetch notes for a patient
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Doctors can view ALL notes for their patients (including admin notes)
    // Admins can view all notes
    let notes;
    if (userRole === 'admin') {
      notes = await prisma.doctorNote.findMany({
        where: { patientId },
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userRole === 'doctor') {
      // Verify doctor has access to this patient
      const connection = await prisma.doctorPatient.findFirst({
        where: {
          doctorId: userId,
          patientId,
          status: 'active',
        },
      });

      if (!connection) {
        return NextResponse.json({ error: 'Patient not found or not connected' }, { status: 404 });
      }

      // Fetch ALL notes for this patient (from all doctors/admins)
      notes = await prisma.doctorNote.findMany({
        where: {
          patientId,
        },
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST: Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'doctor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { patientId, noteType, title, content } = body;

    if (!patientId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify patient exists and is connected (for doctors) or just exists (for admins)
    if (userRole === 'doctor') {
      const connection = await prisma.doctorPatient.findFirst({
        where: {
          doctorId: userId,
          patientId,
          status: 'active',
        },
      });

      if (!connection) {
        return NextResponse.json({ error: 'Patient not found or not connected' }, { status: 404 });
      }
    } else if (userRole === 'admin') {
      const patient = await prisma.user.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
    }

    const note = await prisma.doctorNote.create({
      data: {
        doctorId: userId,
        patientId,
        noteType: noteType || 'general',
        title,
        content,
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// PUT: Update a note
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const body = await request.json();
    const { noteId, noteType, title, content } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Check if note exists and user has permission
    const existingNote = await prisma.doctorNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only the doctor who created the note or an admin can edit it
    if (userRole !== 'admin' && existingNote.doctorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const note = await prisma.doctorNote.update({
      where: { id: noteId },
      data: {
        noteType: noteType || existingNote.noteType,
        title,
        content,
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE: Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Check if note exists and user has permission
    const existingNote = await prisma.doctorNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only the doctor who created the note or an admin can delete it
    if (userRole !== 'admin' && existingNote.doctorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.doctorNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
