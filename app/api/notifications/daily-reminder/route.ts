

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
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

// This endpoint should be called by a cron job service
// For security, you can add an API key check here
export async function POST(request: Request) {
  try {
    // Optional: Add API key authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Get all users who have daily reminders enabled for this time
    const usersWithReminders = await prisma.notificationSettings.findMany({
      where: {
        dailyReminderEnabled: true,
        dailyReminderTime: currentTime,
      },
      include: {
        user: {
          include: {
            treatmentPlan: true,
          },
        },
      },
    });

    let successCount = 0;
    let failureCount = 0;

    // Send reminders to each user
    for (const settings of usersWithReminders) {
      const user = settings.user;
      
      // Get user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: user.id },
      });

      if (subscriptions.length === 0) {
        continue;
      }

      // Calculate streak
      const wearTimeLogs = await prisma.wearTimeLog.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 30,
      });

      const goal = user.treatmentPlan?.dailyWearTimeGoal || 22;
      const streak = calculateStreak(wearTimeLogs, goal);

      // Prepare notification content with motivational messages
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
    }

    return NextResponse.json({
      success: true,
      usersProcessed: usersWithReminders.length,
      notificationsSent: successCount,
      notificationsFailed: failureCount,
    });
  } catch (error) {
    console.error('Error sending daily reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send daily reminders' },
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

