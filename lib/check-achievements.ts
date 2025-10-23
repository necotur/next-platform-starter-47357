
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkAndUnlockAchievements(userId: string) {
  try {
    // Get all user data needed for checking achievements
    const [wearTimeLogs, treatmentPlan, unlockedAchievements, progressPhotos] = await Promise.all([
      prisma.wearTimeLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 365, // Get last year of data
      }),
      prisma.treatmentPlan.findUnique({
        where: { userId },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      prisma.progressPhoto.findMany({
        where: { userId },
        select: { alignerNumber: true },
      }),
    ]);

    const unlockedIds = new Set(unlockedAchievements.map((ua: any) => ua.achievementId));

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    const goal = treatmentPlan?.dailyWearTimeGoal || 22;
    const totalAligners = treatmentPlan?.totalAligners || 20;

    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) {
        continue;
      }

      let shouldUnlock = false;

      // Check based on achievement requirements
      const req = JSON.parse(achievement.requirement);

      switch (req.type) {
        case 'first_log':
          // Unlock on first wear time log
          shouldUnlock = wearTimeLogs.length >= 1;
          break;

        case 'perfect_day':
          // Unlock when user logs >= goal hours in a single day
          shouldUnlock = wearTimeLogs.some((log: any) => log.hoursWorn >= goal);
          break;

        case 'week_streak':
          // Unlock for 7 consecutive days of >= goal hours
          shouldUnlock = calculateStreak(wearTimeLogs, goal) >= 7;
          break;

        case 'two_week_streak':
          // Unlock for 14 consecutive days of >= goal hours
          shouldUnlock = calculateStreak(wearTimeLogs, goal) >= 14;
          break;

        case 'month_streak':
          // Unlock for 30 consecutive days of >= goal hours
          shouldUnlock = calculateStreak(wearTimeLogs, goal) >= 30;
          break;

        case 'three_month_streak':
          // Unlock for 90 consecutive days of >= goal hours
          shouldUnlock = calculateStreak(wearTimeLogs, goal) >= 90;
          break;

        case 'total_days':
          // Unlock when reaching X total days of tracking
          shouldUnlock = wearTimeLogs.length >= req.days;
          break;

        case 'compliance_rate':
          // Unlock when having X% compliance over last Y days
          const recentLogs = wearTimeLogs.slice(0, req.days || 30);
          const compliantDays = recentLogs.filter((log: any) => log.hoursWorn >= goal).length;
          const complianceRate = recentLogs.length > 0 
            ? (compliantDays / recentLogs.length) * 100 
            : 0;
          shouldUnlock = complianceRate >= req.rate;
          break;

        case 'first_aligner_photos':
          // Unlock when user uploads photos for aligner #1
          shouldUnlock = progressPhotos.some((photo: any) => photo.alignerNumber === 1);
          break;

        case 'last_aligner_photos':
          // Unlock when user uploads photos for the last aligner
          shouldUnlock = progressPhotos.some((photo: any) => photo.alignerNumber === totalAligners);
          break;

        default:
          break;
      }

      // Unlock the achievement if conditions are met
      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Send notification to patient only
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, fullName: true },
        });

        if (user?.role === 'patient') {
          try {
            // Try to send web push notification
            await sendAchievementNotification(userId, achievement.name, achievement.icon);
          } catch (notifError) {
            console.error('Failed to send notification:', notifError);
            // Don't fail the whole process if notification fails
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

async function sendAchievementNotification(userId: string, achievementName: string, achievementIcon: string) {
  try {
    // Get user's language preference
    // For now, default to English. Can be extended to check user preferences
    const language = 'en';

    // Prepare notification titles/bodies based on language
    const notificationContent: Record<string, { title: string; body: string }> = {
      en: {
        title: 'Achievement Unlocked! 🎉',
        body: `Congratulations! You unlocked "${achievementName}"`,
      },
      ar: {
        title: 'تم فتح الإنجاز! 🎉',
        body: `تهانينا! لقد فتحت "${achievementName}"`,
      },
      tr: {
        title: 'Başarının Kilidi Açıldı! 🎉',
        body: `Tebrikler! "${achievementName}" kilidini açtınız`,
      },
      ku: {
        title: 'Serkeftin Vebû! 🎉',
        body: `Pîrozbahî! We "${achievementName}" vekir`,
      },
    };

    const content = notificationContent[language] || notificationContent.en;

    // Try to send notification using Firebase Admin and FCM tokens
    try {
      const admin = (await import('firebase-admin')).default;
      
      if (admin.apps.length > 0) {
        const messaging = admin.messaging();
        
        // Get user's FCM tokens
        const fcmTokens = await prisma.fCMToken.findMany({
          where: { userId },
        });

        // Send to all user's devices
        for (const tokenRecord of fcmTokens) {
          try {
            await messaging.send({
              token: tokenRecord.token,
              notification: {
                title: content.title,
                body: content.body,
              },
              data: {
                type: 'achievement',
                achievementName,
                icon: achievementIcon,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (tokenError) {
            console.error(`Failed to send to token:`, tokenError);
          }
        }
        
        console.log(`Achievement notification sent to user ${userId}: ${content.title} - ${content.body}`);
      }
    } catch (fcmError) {
      console.log('FCM not configured or error occurred, skipping push notification:', fcmError);
    }
  } catch (error) {
    console.error('Error sending achievement notification:', error);
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
