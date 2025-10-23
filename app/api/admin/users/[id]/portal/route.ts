

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

// Update patient portal URL (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    // In production, verify admin authentication here
    
    const { portalUrl } = await request.json();
    const patientId = params.id;

    // Update the patient's portal URL
    const updatedUser = await prisma.user.update({
      where: { 
        id: patientId,
        role: 'patient' // Ensure we're only updating patients
      },
      data: {
        smile3dPortalUrl: portalUrl || null,
      },
      select: {
        id: true,
        smile3dPortalUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      portalUrl: updatedUser.smile3dPortalUrl,
    });
  } catch (error) {
    console.error('Error updating portal URL:', error);
    return NextResponse.json(
      { error: 'Failed to update portal URL' },
      { status: 500 }
    );
  }
}
