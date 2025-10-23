

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@seamlesssmile.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Test endpoint to send a daily reminder to the current user
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found. Please enable notifications first.' },
        { status: 404 }
      );
    }

    // Get user's treatment plan and wear time logs
    const [treatmentPlan, wearTimeLogs] = await Promise.all([
      prisma.treatmentPlan.findUnique({
        where: { userId },
      }),
      prisma.wearTimeLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    const goal = treatmentPlan?.dailyWearTimeGoal || 22;
    const streak = calculateStreak(wearTimeLogs, goal);

    // Prepare notification content
    let title = '⏰ Time to Track Your Wear Time!';
    let body = 'Remember to log your aligner wear time for today.';

    if (streak > 0) {
      title = `🔥 ${streak} Day Streak!`;
      body = `Keep it going! Don't break your ${streak}-day streak. Log your wear time now.`;
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type: 'daily_reminder',
        url: '/track',
      },
    });

    let successCount = 0;
    let failureCount = 0;

    // Send to all user's subscriptions
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
        successCount++;
      } catch (error: any) {
        console.error('Error sending notification:', error);
        failureCount++;
        
        // If subscription is expired or invalid, delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily reminder sent successfully',
      notificationsSent: successCount,
      notificationsFailed: failureCount,
      streak,
    });
  } catch (error) {
    console.error('Error sending test daily reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send test daily reminder' },
      { status: 500 }
    );
  }
}

function calculateStreak(logs: any[], goal: number): number {
  if (!logs || logs.length === 0) return 0;

  // Sort by date descending
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if we need to start from today or yesterday
  const mostRecentDate = new Date(sortedLogs[0].date);
  mostRecentDate.setHours(0, 0, 0, 0);

  let currentDate = new Date(today);
  
  // If the most recent log is not today or yesterday, streak is 0
  const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 1) {
    return 0;
  }

  // Count consecutive days from most recent
  for (const log of sortedLogs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    // If log is for expected date and meets goal
    if (logDate.getTime() === currentDate.getTime() && log.hoursWorn >= goal) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
    } else if (logDate.getTime() < currentDate.getTime()) {
      // Gap in streak
      break;
    }
  }

  return streak;
}

