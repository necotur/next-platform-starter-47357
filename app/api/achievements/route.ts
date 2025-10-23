
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { en, ar, tr, ku } from '@/lib/i18n';

const prisma = new PrismaClient();

// Map achievement names to translation keys
const achievementTranslationMap: Record<string, { name: string; desc: string }> = {
  'First Step': { name: 'firstStep', desc: 'firstStepDesc' },
  'Perfect Day': { name: 'perfectDay', desc: 'perfectDayDesc' },
  'Week Warrior': { name: 'weekWarrior', desc: 'weekWarriorDesc' },
  'Two Week Champion': { name: 'twoWeekChampion', desc: 'twoWeekChampionDesc' },
  'Monthly Master': { name: 'monthlyMaster', desc: 'monthlyMasterDesc' },
  'Three Month Legend': { name: 'threeMonthLegend', desc: 'threeMonthLegendDesc' },
  'Committed': { name: 'committed', desc: 'committedDesc' },
  'Consistency King': { name: 'consistencyKing', desc: 'consistencyKingDesc' },
  'Picture Perfect Start': { name: 'picturePerfectStart', desc: 'picturePerfectStartDesc' },
  'Journey Complete': { name: 'journeyComplete', desc: 'journeyCompleteDesc' },
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Get language from query parameter or default to 'en'
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const translations = language === 'ar' ? ar : language === 'tr' ? tr : language === 'ku' ? ku : en;
    
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua: any) => ua.achievementId));
    
    const achievements = allAchievements.map((achievement: any) => {
      const translationKeys = achievementTranslationMap[achievement.name];
      const name = translationKeys 
        ? (translations.achievements as any)[translationKeys.name]
        : achievement.name;
      const description = translationKeys
        ? (translations.achievements as any)[translationKeys.desc]
        : achievement.description;

      return {
        ...achievement,
        name,
        description,
        unlocked: unlockedIds.has(achievement.id),
        unlockedAt: userAchievements.find((ua: any) => ua.achievementId === achievement.id)?.unlockedAt,
      };
    });

    return NextResponse.json(achievements ?? []);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
