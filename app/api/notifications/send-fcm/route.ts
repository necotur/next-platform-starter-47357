
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendFCMNotification } from '@/lib/fcm-notifications';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, body: messageBody, data } = body;

    if (!userId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Send FCM notification using shared function
    const result = await sendFCMNotification({
      userId,
      title,
      body: messageBody,
      data,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error sending FCM notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification: ' + error.message },
      { status: 500 }
    );
  }
}
