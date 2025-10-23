
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin account
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@seamlesssmile.com',
      password: adminPassword,
      fullName: 'System Admin',
      role: 'admin',
    },
  });

  console.log('✅ Created admin user:', admin.username);
  console.log('   Username: admin');
  console.log('   Password: admin123');

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'johndoe' },
    update: {},
    create: {
      username: 'johndoe',
      password: hashedPassword,
      fullName: 'John Doe',
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create treatment plan for test user
  const startDate = new Date();
  const treatmentPlan = await prisma.treatmentPlan.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      startDate: startDate,
      totalAligners: 20,
      currentAlignerNumber: 1,
      alignerChangeInterval: 14,
      dailyWearTimeGoal: 22,
      lastAlignerChangeDate: startDate,
      nextAlignerChangeDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created treatment plan');

  // Create notification settings
  await prisma.notificationSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      dailyReminderEnabled: true,
      dailyReminderTime: '21:00',
      alignerChangeReminderEnabled: true,
    },
  });

  console.log('✅ Created notification settings');

  // Create achievements
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
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }

  console.log('✅ Created achievements');

  // Award first achievement to test user
  const firstAchievement = await prisma.achievement.findUnique({
    where: { name: 'First Step' },
  });

  if (firstAchievement) {
    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId: user.id,
          achievementId: firstAchievement.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        achievementId: firstAchievement.id,
      },
    });
    console.log('✅ Awarded first achievement');
  }

  // Create some sample wear time logs
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    await prisma.wearTimeLog.create({
      data: {
        userId: user.id,
        date: date,
        hoursWorn: 20 + Math.random() * 4, // Random between 20-24 hours
      },
    });
  }

  console.log('✅ Created sample wear time logs');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
