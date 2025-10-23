

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { useLanguage } from '@/contexts/language-context';
import { Award, Lock, Calendar } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      setUserRole(role || '');
      
      // Redirect admins to admin dashboard
      if (role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      // Redirect doctors to their dashboard
      if (role === 'doctor') {
        router.push('/doctor/dashboard');
        return;
      }
      fetchAchievements();
    }
  }, [status, router, session, language]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/achievements?lang=${language}`);
      if (response.ok) {
        setAchievements(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title={t.achievements.title} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Overview */}
        <div 
          className="bg-gradient-to-br rounded-2xl p-6 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {t.treatmentPlan.progress}
              </h2>
              <p className="text-white/80 text-sm">
                {unlockedCount} {t.common.of} {totalCount} {t.achievements.unlocked}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>{t.achievements.title} {t.achievements.unlocked}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.common.all} {t.achievements.title}
          </h3>
          
          <div className="space-y-3">
            {achievements.map((achievement) => {
              const isClickable = userRole === 'patient' && achievement.unlocked;
              const CardComponent = isClickable ? 'button' : 'div';
              
              return (
                <CardComponent
                  key={achievement.id}
                  onClick={isClickable ? () => router.push(`/achievements/congrats/${achievement.id}`) : undefined}
                  className={`bg-white rounded-xl p-5 shadow-md transition-all w-full text-left ${
                    achievement.unlocked ? 'opacity-100' : 'opacity-60'
                  } ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}`}
                >
                  <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      achievement.unlocked ? '' : 'grayscale'
                    }`}
                    style={{
                      backgroundColor: achievement.unlocked ? '#FFF5F8' : '#F3F4F6',
                    }}
                  >
                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className="font-semibold text-lg"
                        style={{ color: achievement.unlocked ? '#3F0F22' : '#6B7280' }}
                      >
                        {achievement.name}
                      </h4>
                      {achievement.unlocked && (
                        <Award className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {achievement.description}
                    </p>
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t.achievements.unlocked}{' '}
                          {new Date(achievement.unlockedAt).toLocaleDateString(
                            language === 'ar' ? 'ar-SA' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                    )}
                    
                    {!achievement.unlocked && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#AF4B6C' }}>
                        <Lock className="w-4 h-4" />
                        <span>{t.achievements.locked}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardComponent>
            );
          })}
          </div>

          {achievements.length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {t.achievements.noAchievements}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {t.achievements.startTracking}
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
