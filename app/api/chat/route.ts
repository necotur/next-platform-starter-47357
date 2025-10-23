
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { sendFCMNotification } from '@/lib/fcm-notifications';
import { sendWebPushNotification } from '@/lib/web-push-notifications';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { receiverId, content, messageType, photoUrl } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: user.id,
        receiverId,
        content,
        messageType: messageType || 'text',
        photoUrl: photoUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            image: true,
          },
        },
      },
    });

    // Send push notifications to receiver (asynchronously, don't wait for them)
    const notificationTitle = `New message from ${user.fullName || 'Someone'}`;
    const notificationBody = messageType === 'photo' ? 'Sent you a photo' : content.substring(0, 100);
    const notificationData = {
      type: 'chat_message',
      senderId: user.id,
      messageId: message.id,
    };
    
    // Send FCM notification (for native apps)
    sendFCMNotification({
      userId: receiverId,
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
    }).catch(err => {
      console.error('[Chat] Failed to send FCM notification:', err);
    });
    
    // Send Web Push notification (for PWA)
    sendWebPushNotification({
      userId: receiverId,
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
      url: `/chat?userId=${user.id}`,
    }).catch(err => {
      console.error('[Chat] Failed to send Web Push notification:', err);
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const otherUserId = url.searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            image: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
