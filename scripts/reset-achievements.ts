
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up old achievements...');

  // Delete all existing achievements and user achievements
  await prisma.userAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});

  console.log('✅ Old achievements removed');

  // Create new achievements
  const achievements = [
    {
      name: 'First Step',
      description: 'Logged your first wear time',
      icon: '🎯',
      requirement: JSON.stringify({ type: 'first_log' }),
    },
    {
      name: 'Perfect Day',
      description: 'Reached your daily wear time goal',
      icon: '⭐',
      requirement: JSON.stringify({ type: 'perfect_day' }),
    },
    {
      name: 'Week Warrior',
      description: 'Achieved 7 consecutive days of compliance',
      icon: '🔥',
      requirement: JSON.stringify({ type: 'week_streak' }),
    },
    {
      name: 'Two Week Champion',
      description: 'Achieved 14 consecutive days of compliance',
      icon: '💪',
      requirement: JSON.stringify({ type: 'two_week_streak' }),
    },
    {
      name: 'Monthly Master',
      description: 'Achieved 30 consecutive days of compliance',
      icon: '🏆',
      requirement: JSON.stringify({ type: 'month_streak' }),
    },
    {
      name: 'Three Month Legend',
      description: 'Achieved 90 consecutive days of compliance',
      icon: '👑',
      requirement: JSON.stringify({ type: 'three_month_streak' }),
    },
    {
      name: 'Committed',
      description: 'Tracked your wear time for 30 days',
      icon: '📅',
      requirement: JSON.stringify({ type: 'total_days', days: 30 }),
    },
    {
      name: 'Consistency King',
      description: 'Maintained 90% compliance over 30 days',
      icon: '🎊',
      requirement: JSON.stringify({ type: 'compliance_rate', days: 30, rate: 90 }),
    },
    {
      name: 'Picture Perfect Start',
      description: 'Captured your first aligner photos',
      icon: '📸',
      requirement: JSON.stringify({ type: 'first_aligner_photos' }),
    },
    {
      name: 'Journey Complete',
      description: 'Captured your final aligner photos',
      icon: '🎓',
      requirement: JSON.stringify({ type: 'last_aligner_photos' }),
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
  }

  console.log('✅ Created new achievements');
  console.log('🎉 Reset completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
